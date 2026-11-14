import { asc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { saveAssetAction, saveServiceAction } from "@/app/actions/admin";
import { PageHeader, Panel, Table, textareaCls } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/client";
import { RateInputs } from "@/components/rate-inputs";
import { PublishBadge } from "@/components/status";
import { Badge, Field, btnSm, inputCls } from "@/components/ui";
import { db } from "@/db";
import { companies, contentAssets, professions, serviceProfessions, services } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { assetTypeLabel, rateStatusLabel, stageLabel } from "@/lib/labels";
import { AssetFields } from "../../materialy/asset-fields";

const TA = ({ name, label, value, hint, rows = 4 }: { name: string; label: string; value: string | string[]; hint?: string; rows?: number }) => (
  <Field label={label} hint={hint}><textarea name={name} rows={rows} defaultValue={Array.isArray(value) ? value.join("\n") : value} className={textareaCls} /></Field>
);

export default async function EditService({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [s] = await db.select().from(services).where(eq(services.id, id));
  if (!s) notFound();
  const [comps, profs, sp, assets] = await Promise.all([
    db.select().from(companies).orderBy(asc(companies.sort)),
    db.select().from(professions).orderBy(asc(professions.sort)),
    db.select().from(serviceProfessions).where(eq(serviceProfessions.serviceId, id)),
    db.select({
      a: contentAssets,
      links: sql<number>`(select count(*)::int from referral_links l where l.asset_id = "content_assets"."id")`,
      clicks: sql<number>`(select count(*)::int from referral_clicks rc join referral_links l on l.id = rc.link_id where l.asset_id = "content_assets"."id")`,
      leads: sql<number>`(select count(*)::int from leads ld join referral_links l on l.id = ld.link_id where l.asset_id = "content_assets"."id")`,
    }).from(contentAssets).where(eq(contentAssets.serviceId, id)).orderBy(asc(contentAssets.stage), asc(contentAssets.sort)),
  ]);
  const oneLine = "Jedna pozycja w wierszu";

  return (
    <>
      <PageHeader title={s.name} sub={<Link href="/admin/uslugi" className="underline">← Wszystkie usługi</Link>}>
        <PublishBadge status={s.status} />
        {s.status === "published" && <Link href={`/uslugi/${s.slug}`} target="_blank" className={btnSm()}>Podgląd publiczny</Link>}
      </PageHeader>

      <ActionForm action={saveServiceAction} className="space-y-5">
        <input type="hidden" name="id" value={s.id} />
        <Panel title="Podstawy i publikacja">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nazwa"><input name="name" defaultValue={s.name} required className={inputCls} /></Field>
            <Field label="Adres (slug)"><input name="slug" defaultValue={s.slug} required className={inputCls} /></Field>
            <Field label="Spółka"><select name="companyId" defaultValue={s.companyId} className={inputCls}>{comps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Kategoria"><input name="category" defaultValue={s.category} className={inputCls} /></Field>
            <Field label="Status" hint="Szkic i ukryta nie są widoczne dla partnerów.">
              <select name="status" defaultValue={s.status} className={inputCls}><option value="draft">Szkic</option><option value="published">Opublikowana</option><option value="hidden">Ukryta</option></select>
            </Field>
            <Field label="Dostęp do polecania" hint="Dla usług prawnych, finansowych i zdrowotnych — zatwierdzenie formy współpracy per partner.">
              <select name="access" defaultValue={s.access} className={inputCls}><option value="open">Otwarta dla aktywnych partnerów</option><option value="approval_required">Wymaga zatwierdzenia</option></select>
            </Field>
            <Field label="Kolejność"><input name="sort" type="number" defaultValue={s.sort} className={inputCls} /></Field>
            <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm font-semibold"><input type="checkbox" name="sensitive" defaultChecked={s.sensitive} className="size-4 accent-leather" />Usługa wrażliwa (zdrowie / sprawy rodzinne)</label>
          </div>
        </Panel>

        <Panel title="Prowizja">
          <RateInputs model={s.commissionModel} amount={s.commissionAmount} bps={s.commissionBps} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Status stawki" hint="„Demo” jest widoczna tylko w trybie demo; w produkcji partner zobaczy „Stawka do ustalenia”.">
              <select name="rateStatus" defaultValue={s.rateStatus} className={inputCls}>{Object.entries(rateStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </Field>
            <Field label="Warunek naliczenia" hint="Np. „Za zakończoną i opłaconą usługę”"><input name="commissionCondition" defaultValue={s.commissionCondition} className={inputCls} /></Field>
            <Field label="Opis modelu niestandardowego" hint="Pokazywany zamiast kwoty przy modelu niestandardowym"><input name="commissionNote" defaultValue={s.commissionNote} className={inputCls} /></Field>
          </div>
          <div className="mt-3"><TA name="commissionTerms" label="Regulamin / warunki prowizji" value={s.commissionTerms} rows={3} /></div>
          <p className="mt-2 text-xs text-muted">Zmiana stawki działa tylko na przyszłe naliczenia. Każda naliczona prowizja przechowuje stawkę z chwili naliczenia.</p>
        </Panel>

        <Panel title="Treści dla partnera">
          <div className="grid gap-3">
            <TA name="clientBenefit" label="Krótki opis sprzedażowy (korzyść klienta)" value={s.clientBenefit} rows={2} />
            <Field label="Hasło skojarzeniowe — co słyszysz od klienta" hint="Pokazywane nad nazwą jako: Słyszysz: „…”? Np. długi osobiste"><input name="hook" defaultValue={s.hook ?? ""} className={inputCls} /></Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Ekspert — imię i nazwisko"><input name="expertName" defaultValue={s.expertName ?? ""} className={inputCls} /></Field>
              <Field label="Ekspert — rola / tytuł"><input name="expertTitle" defaultValue={s.expertTitle ?? ""} className={inputCls} /></Field>
              <Field label="Ekspert — zdjęcie (https://… lub /…)"><input name="expertPhotoUrl" defaultValue={s.expertPhotoUrl ?? ""} className={inputCls} /></Field>
            </div>
            <Field label="Dla kogo — jedna linia"><input name="audienceShort" defaultValue={s.audienceShort} className={inputCls} /></Field>
            <TA name="description" label="Czym jest usługa (pełny opis)" value={s.description} />
            <div className="grid gap-3 md:grid-cols-2">
              <TA name="problems" label="Jakie problemy rozwiązuje" value={s.problems} hint={oneLine} />
              <TA name="audience" label="Dla kogo jest przeznaczona" value={s.audience} hint={oneLine} />
              <TA name="whenToRecommend" label="Kiedy polecać" value={s.whenToRecommend} hint={oneLine} />
              <TA name="signals" label="Sygnały, że klient może jej potrzebować" value={s.signals} hint={oneLine} />
              <TA name="arguments" label="Najważniejsze argumenty" value={s.arguments} hint={oneLine} />
              <TA name="doNotPromise" label="Czego nie obiecywać" value={s.doNotPromise} hint={oneLine} />
            </div>
            <TA name="pitch" label="Jak przedstawić w 15–30 sekund" value={s.pitch} />
            <TA name="faq" label="Pytania klientów (FAQ)" value={s.faq.map((f) => `${f.q} | ${f.a}`)} hint="Jeden wiersz = Pytanie | Odpowiedź" rows={5} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Wideo o usłudze — reel 9:16 (https://… lub /…)" hint="Bezpośredni adres pliku mp4/webm. Puste = brak sekcji wideo."><input name="reelUrl" defaultValue={s.reelUrl ?? ""} placeholder="https://…/usluga.mp4" className={inputCls} /></Field>
              <Field label="Okładka wideo (obraz, opcjonalnie)"><input name="reelPosterUrl" defaultValue={s.reelPosterUrl ?? ""} className={inputCls} /></Field>
            </div>
            <Field label="Kto realizuje usługę"><input name="provider" defaultValue={s.provider} className={inputCls} /></Field>
          </div>
        </Panel>

        <Panel title="Grupy docelowe partnerów">
          <p className="mb-3 text-sm text-muted">Dopasowanie służy podpowiedziom („Polecane dla Ciebie”). Nie nadaje uprawnień do polecania.</p>
          <div className="grid gap-2 md:grid-cols-2">
            {profs.map((p) => {
              const cur = sp.find((x) => x.professionSlug === p.slug);
              return (
                <div key={p.slug} className="rounded-xl border border-line p-3">
                  <label className="flex items-center gap-2.5 text-sm font-semibold"><input type="checkbox" name="professions" value={p.slug} defaultChecked={!!cur} className="size-4 accent-leather" />{p.name}</label>
                  <input name={`reason_${p.slug}`} defaultValue={cur?.reason ?? ""} placeholder="Dlaczego pasuje do tej grupy" aria-label={`Uzasadnienie: ${p.name}`} className={`${inputCls} mt-2 min-h-9 text-sm`} />
                </div>
              );
            })}
          </div>
        </Panel>
        <div className="sticky bottom-3 z-10 flex justify-end"><SubmitButton className="shadow-lg" data-testid="service-save">Zapisz usługę</SubmitButton></div>
      </ActionForm>

      <Panel title="Materiały polecające" className="mt-6">
        <Table head={["Materiał", "Etap", "Status", "Cel", "Linki", "Klik.", "Leady", ""]}>
          {assets.map(({ a, links, clicks, leads }) => (
            <tr key={a.id}>
              <td><span className="font-semibold">{a.title}</span><span className="block text-xs text-muted">{assetTypeLabel[a.type]} · kolejność {a.sort}</span></td>
              <td><Badge>{stageLabel[a.stage]}</Badge></td><td><PublishBadge status={a.status} /></td>
              <td className="max-w-[180px] truncate text-xs">{a.targetUrl ?? <span className="text-muted">strona demo</span>}</td>
              <td className="tabular">{links}</td><td className="tabular">{clicks}</td><td className="tabular">{leads}</td>
              <td><Link href={`/admin/materialy/${a.id}`} className={btnSm()}>Edytuj</Link></td>
            </tr>
          ))}
          {assets.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted">Brak materiałów.</td></tr>}
        </Table>
        <details className="mt-4 rounded-xl border border-line px-4">
          <summary className="flex min-h-12 items-center font-bold text-leather">+ Dodaj materiał</summary>
          <ActionForm action={saveAssetAction} resetOnOk className="pb-4">
            <input type="hidden" name="serviceId" value={s.id} />
            <AssetFields />
            <SubmitButton small className="mt-3">Dodaj materiał</SubmitButton>
          </ActionForm>
        </details>
      </Panel>
    </>
  );
}
