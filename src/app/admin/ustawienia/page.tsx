import { asc } from "drizzle-orm";
import { createManagerAction, removeMyPhotoAction, saveFaqAction, saveMyPhotoAction, saveMyProfileAction, saveProfessionAction, saveSettingsAction } from "@/app/actions/admin";
import { PageHeader, Panel, textareaCls } from "@/components/admin";
import { AvatarEditor } from "@/components/avatar";
import { ActionForm, SubmitButton } from "@/components/client";
import { Field, Notice, inputCls } from "@/components/ui";
import { db } from "@/db";
import { landingFaqs, professions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { listManagers } from "@/lib/messages";
import { getSettings } from "@/lib/settings";

export default async function SettingsPage() {
  const { user: me } = await requireAdmin();
  const managers = await listManagers();
  const myPhoto = managers.find((m) => m.id === me.id)?.photoVersion ?? null;
  const [cfg, faqs, profs] = await Promise.all([getSettings(), db.select().from(landingFaqs).orderBy(asc(landingFaqs.sort)), db.select().from(professions).orderBy(asc(professions.sort))]);
  const webhookReady = !!env.webhookSecret && !env.webhookSecret.startsWith("change-me");
  return (
    <>
      <PageHeader title="Ustawienia" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Atrybucja i konta">
          <ActionForm action={saveSettingsAction} className="space-y-3">
            <Field label="Okno atrybucji (dni)" hint="Jak długo po kliknięciu klient pozostaje przypisany do partnera."><input name="attribution_window_days" type="number" min={1} max={365} defaultValue={cfg.attribution_window_days} className={inputCls} /></Field>
            <Field label="Reguła atrybucji"><input disabled value="Pierwszy partner w oknie atrybucji (first touch), osobno dla każdej usługi" className={`${inputCls} bg-sand text-muted`} /></Field>
            <Field label="Wersja regulaminu" hint="Zapisywana przy rejestracji partnera."><input name="terms_version" defaultValue={cfg.terms_version} className={inputCls} /></Field>
            <label className="flex items-center gap-2.5 text-sm font-semibold"><input type="checkbox" name="auto_approve_partners" defaultChecked={cfg.auto_approve_partners} className="size-4 accent-leather" />Automatycznie aktywuj nowe konta partnerów</label>
            <SubmitButton small>Zapisz ustawienia</SubmitButton>
          </ActionForm>
        </Panel>

        <Panel title="Integracje">
          <Notice tone={webhookReady ? "ok" : "warn"}>{webhookReady ? "Webhook jest skonfigurowany (ustawiono WEBHOOK_SECRET)." : "Webhook nie jest skonfigurowany — ustaw WEBHOOK_SECRET w środowisku."}</Notice>
          <p className="mt-3 text-sm text-ink/85">Zewnętrzne CRM i formularze spółek wysyłają zdarzenia na:</p>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-cream p-3 text-xs">{`POST ${env.appUrl}/api/v1/events
Authorization: Bearer <WEBHOOK_SECRET>
Idempotency-Key: <unikalny identyfikator zdarzenia>

{ "type": "sale.confirmed", "service": "znak-towarowy",
  "external_id": "CRM-1001", "ref": "<pp_ref>", "net_amount": 2500 }`}</pre>
          <p className="mt-2 text-xs text-muted">Typy: lead.created, lead.status, sale.confirmed, sale.refunded. Żadna integracja zewnętrzna nie jest obecnie podłączona — system pokazuje wyłącznie dane, które faktycznie otrzymał. Szczegóły w README.</p>
          <p className="mt-2 text-xs text-muted">Tryb demo: <b>{env.demoMode ? "włączony" : "wyłączony"}</b> (zmienna DEMO_MODE). Poza trybem demo stawki „Demo” są ukryte jako „Stawka do ustalenia”.</p>
        </Panel>

        <Panel title="Opiekunowie partnerów" className="lg:col-span-2">
          <p className="mb-3 text-sm text-muted">Partner widzi swojego opiekuna (imię, stanowisko, telefon, e-mail) w zakładce Wiadomości i może do niego pisać. Domyślnym opiekunem jest pierwszy administrator; innego przypiszesz w widoku partnera.</p>
          <div className="grid gap-5 lg:grid-cols-2">
            <ActionForm action={saveMyProfileAction} className="space-y-3">
              <p className="text-sm font-extrabold text-leather-dark">Mój profil opiekuna</p>
              <AvatarEditor light src={myPhoto ? `/api/manager-photo/${me.id}?v=${myPhoto}` : null} initials={`${me.firstName[0] ?? ""}${me.lastName[0] ?? ""}`.toUpperCase()} onSave={saveMyPhotoAction} onRemove={removeMyPhotoAction} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Imię"><input name="firstName" defaultValue={me.firstName} required className={inputCls} /></Field>
                <Field label="Nazwisko"><input name="lastName" defaultValue={me.lastName} required className={inputCls} /></Field>
              </div>
              <Field label="Stanowisko"><input name="jobTitle" defaultValue={me.jobTitle ?? ""} placeholder="Opiekun partnerów" className={inputCls} /></Field>
              <Field label="Telefon dla partnerów"><input name="phone" type="tel" defaultValue={me.phone ?? ""} placeholder="+48 600 000 000" className={inputCls} data-testid="my-phone" /></Field>
              <SubmitButton small data-testid="my-profile-save">Zapisz profil</SubmitButton>
            </ActionForm>
            <div>
              <p className="text-sm font-extrabold text-leather-dark">Zespół ({managers.length})</p>
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line text-sm">
                {managers.map((m) => <li key={m.id} className="flex flex-wrap justify-between gap-2 px-3 py-2"><span className="font-semibold">{m.firstName} {m.lastName}</span><span className="text-muted">{m.phone ?? "brak telefonu"} · {m.email}</span></li>)}
              </ul>
              <details className="mt-3 rounded-xl border border-line px-3">
                <summary className="flex min-h-11 items-center text-sm font-bold text-leather">+ Dodaj opiekuna</summary>
                <ActionForm action={createManagerAction} resetOnOk className="space-y-2 pb-3">
                  <div className="grid grid-cols-2 gap-2"><input name="firstName" placeholder="Imię" aria-label="Imię" required className={inputCls} /><input name="lastName" placeholder="Nazwisko" aria-label="Nazwisko" required className={inputCls} /></div>
                  <input name="email" type="email" placeholder="E-mail (login)" aria-label="E-mail" required className={inputCls} />
                  <div className="grid grid-cols-2 gap-2"><input name="phone" type="tel" placeholder="Telefon" aria-label="Telefon" className={inputCls} /><input name="jobTitle" placeholder="Stanowisko" aria-label="Stanowisko" className={inputCls} /></div>
                  <input name="password" type="password" placeholder="Hasło (min. 10 znaków)" aria-label="Hasło" required minLength={10} autoComplete="new-password" className={inputCls} />
                  <p className="text-xs text-warn">Opiekun otrzymuje pełny dostęp do panelu administratora.</p>
                  <SubmitButton small variant="secondary">Dodaj opiekuna</SubmitButton>
                </ActionForm>
              </details>
            </div>
          </div>
        </Panel>

        <Panel title="FAQ na stronie głównej" className="lg:col-span-2">
          <div className="space-y-2.5">
            {faqs.map((f) => (
              <details key={f.id} className="rounded-xl border border-line px-4">
                <summary className="flex min-h-11 items-center text-sm font-bold">{f.question}{!f.published && <span className="ml-2 text-xs font-medium text-warn">(ukryte)</span>}</summary>
                <ActionForm action={saveFaqAction} className="space-y-2 pb-3">
                  <input type="hidden" name="id" value={f.id} />
                  <input name="question" defaultValue={f.question} aria-label="Pytanie" className={inputCls} />
                  <textarea name="answer" rows={3} defaultValue={f.answer} aria-label="Odpowiedź" className={textareaCls} />
                  <div className="flex flex-wrap items-center gap-3">
                    <input name="sort" type="number" defaultValue={f.sort} aria-label="Kolejność" className={`${inputCls} max-w-24`} />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={f.published} className="size-4 accent-leather" />Opublikowane</label>
                    <SubmitButton small>Zapisz</SubmitButton>
                    <button name="delete" value="1" className="text-sm font-semibold text-danger">Usuń</button>
                  </div>
                </ActionForm>
              </details>
            ))}
          </div>
          <ActionForm action={saveFaqAction} resetOnOk className="mt-4 grid gap-2 border-t border-line pt-4">
            <input name="question" placeholder="Nowe pytanie" aria-label="Nowe pytanie" className={inputCls} />
            <textarea name="answer" rows={2} placeholder="Odpowiedź" aria-label="Odpowiedź" className={textareaCls} />
            <input type="hidden" name="published" value="on" /><input type="hidden" name="sort" value={faqs.length} />
            <div><SubmitButton small variant="secondary">Dodaj pytanie</SubmitButton></div>
          </ActionForm>
        </Panel>

        <Panel title="Grupy zawodowe partnerów" className="lg:col-span-2">
          <div className="grid gap-2 md:grid-cols-2">
            {profs.map((p) => (
              <ActionForm key={p.slug} action={saveProfessionAction} className="rounded-xl border border-line p-3">
                <input type="hidden" name="slug" value={p.slug} />
                <div className="grid grid-cols-[1fr_1fr_64px_auto] items-center gap-2">
                  <input name="name" defaultValue={p.name} aria-label="Nazwa grupy" className={`${inputCls} min-h-9 text-sm`} />
                  <input name="label" defaultValue={p.label} aria-label="Etykieta" className={`${inputCls} min-h-9 text-sm`} />
                  <input name="sort" type="number" defaultValue={p.sort} aria-label="Kolejność" className={`${inputCls} min-h-9 px-2 text-sm`} />
                  <SubmitButton small variant="secondary">OK</SubmitButton>
                </div>
              </ActionForm>
            ))}
          </div>
          <ActionForm action={saveProfessionAction} resetOnOk className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input name="name" placeholder="Nowa grupa, np. Notariusze" aria-label="Nazwa nowej grupy" className={inputCls} />
            <input name="label" placeholder="Etykieta, np. Jestem notariuszem" aria-label="Etykieta nowej grupy" className={inputCls} />
            <SubmitButton small variant="secondary" className="min-h-11">Dodaj grupę</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
