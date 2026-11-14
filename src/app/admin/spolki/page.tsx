import { asc } from "drizzle-orm";
import { refreshGoogleAction, saveCompanyAction } from "@/app/actions/admin";
import { PageHeader, Panel, textareaCls } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/client";
import { Badge, CompanyMark, Field, inputCls } from "@/components/ui";
import { db } from "@/db";
import { companies, type Company } from "@/db/schema";
import { GOOGLE_MIN_RATING, GOOGLE_MIN_REVIEWS, GoogleRating } from "@/components/google";
import { requireAdmin } from "@/lib/auth";
import { googleKeyConfigured } from "@/lib/google-places";
import { fmtDate } from "@/lib/labels";

function CompanyForm({ c }: { c?: Company }) {
  return (
    <ActionForm action={saveCompanyAction} resetOnOk={!c} className="pb-4">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nazwa"><input name="name" defaultValue={c?.name} required className={inputCls} /></Field>
        <Field label="Hasło (tagline)"><input name="tagline" defaultValue={c?.tagline} className={inputCls} /></Field>
        <Field label="Logo — pełny znak (https:// lub /…)" hint="Pokazywane na stronie głównej"><input name="logoUrl" defaultValue={c?.logoUrl ?? ""} className={inputCls} /></Field>
        <Field label="Ikona kwadratowa (https:// lub /…)" hint="Pokazywana na kartach usług. Puste = inicjał na kolorze marki"><input name="iconUrl" defaultValue={c?.iconUrl ?? ""} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kolor"><input name="color" type="color" defaultValue={c?.color ?? "#713B20"} className={`${inputCls} p-1`} /></Field>
          <Field label="Kolejność"><input name="sort" type="number" defaultValue={c?.sort ?? 0} className={inputCls} /></Field>
        </div>
        <Field label="Ocena w Google (1–5)" hint={`Kryterium katalogu: powyżej ${(GOOGLE_MIN_RATING / 10).toFixed(1).replace(".", ",")}`}><input name="googleRating" inputMode="decimal" defaultValue={c?.googleRating != null ? (c.googleRating / 10).toFixed(1).replace(".", ",") : ""} placeholder="np. 4,9" className={inputCls} /></Field>
        <Field label="Liczba opinii w Google" hint={`Kryterium katalogu: min. ${GOOGLE_MIN_REVIEWS}`}><input name="googleReviews" inputMode="numeric" defaultValue={c?.googleReviews ?? ""} className={inputCls} /></Field>
        <Field label="Link do opinii Google (https://…)" className="sm:col-span-2" hint={c?.googleCheckedAt ? `Dane z dnia ${fmtDate(c.googleCheckedAt)}` : "Brak danych — ocena nie jest nigdzie pokazywana"}><input name="googleUrl" defaultValue={c?.googleUrl ?? ""} className={inputCls} /></Field>
        <Field label="Strona www (https://…)"><input name="website" defaultValue={c?.website ?? ""} className={inputCls} /></Field>
        <Field label="Referencje wideo 9:16" hint="Jeden wiersz = Tytuł | adres pliku mp4" className="sm:col-span-2"><textarea name="referenceVideos" rows={2} defaultValue={(c?.referenceVideos ?? []).map((v) => `${v.title} | ${v.url}`).join("\n")} className={textareaCls} /></Field>
        <Field label="Opis" className="sm:col-span-2"><textarea name="description" rows={2} defaultValue={c?.description} className={textareaCls} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2.5 text-sm font-semibold"><input type="checkbox" name="published" defaultChecked={c?.published ?? true} className="size-4 accent-leather" />Widoczna w katalogu</label>
      <SubmitButton small className="mt-3">{c ? "Zapisz spółkę" : "Dodaj spółkę"}</SubmitButton>
    </ActionForm>
  );
}

export default async function CompaniesPage() {
  await requireAdmin();
  const rows = await db.select().from(companies).orderBy(asc(companies.sort));
  const keyReady = googleKeyConfigured();
  return (
    <>
      <PageHeader title="Spółki" sub="Marki, których usługi są w katalogu." />
      <div className="space-y-2.5">
        {rows.map((c) => (
          <details key={c.id} className="rounded-2xl border border-line bg-white px-4">
            <summary className="flex min-h-14 items-center justify-between gap-3"><CompanyMark name={c.name} color={c.color} iconUrl={c.iconUrl} /><span className="flex flex-wrap items-center justify-end gap-2 text-sm text-muted"><GoogleRating rating={c.googleRating} reviews={c.googleReviews} compact />{c.googleRating != null && c.googleReviews != null && (c.googleRating <= GOOGLE_MIN_RATING || c.googleReviews < GOOGLE_MIN_REVIEWS) && <Badge tone="danger">poniżej kryterium</Badge>}{c.tagline}{!c.published && <Badge tone="warn">Ukryta</Badge>}</span></summary>
            <CompanyForm c={c} />
            <ActionForm action={refreshGoogleAction} className="mb-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
              <input type="hidden" name="id" value={c.id} />
              <Field label="Pobierz ocenę z Google" hint={keyReady ? (c.googlePlaceId ? "Puste = odśwież zapisaną wizytówkę" : "Wpisz nazwę i miasto, tak jak w Mapach Google") : "Wymaga zmiennej GOOGLE_MAPS_API_KEY"}>
                <input name="query" placeholder={`${c.name}, miasto`} className={`${inputCls} min-w-[240px]`} disabled={!keyReady} />
              </Field>
              <SubmitButton small variant="secondary" disabled={!keyReady}>Pobierz z Google</SubmitButton>
            </ActionForm>
          </details>
        ))}
      </div>
      <Panel title="Dodaj spółkę" className="mt-5"><CompanyForm /></Panel>
    </>
  );
}
