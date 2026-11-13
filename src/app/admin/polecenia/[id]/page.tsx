import { asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { accrueManualAction, assignPartnerAction, commissionStatusAction, confirmSaleAction, refundAction, setLeadStatusAction } from "@/app/actions/admin";
import { PageHeader, Panel } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/client";
import { Rate } from "@/components/rate";
import { CommissionStatusBadge, LeadStatusBadge } from "@/components/status";
import { Badge, Field, Notice, inputCls } from "@/components/ui";
import { db } from "@/db";
import { commissions, conversions, leadEvents, leads, partnerServiceTerms, partners, referralLinks, contentAssets, services, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { displayRate, effectiveRate, formatPLN, triggerFor } from "@/lib/commission";
import { env } from "@/lib/env";
import { fmtDateTime, leadRef, leadStatusLabel, modelLabel, partnerId, stageLabel } from "@/lib/labels";

const eventLabel: Record<string, string> = { created: "Utworzono", status: "Status klienta", assignment: "Przypisanie partnera", conversion: "Konwersja", commission: "Prowizja", refund: "Zwrot" };

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db.select({ l: leads, s: services, p: partners, u: users }).from(leads)
    .innerJoin(services, eq(services.id, leads.serviceId)).leftJoin(partners, eq(partners.id, leads.partnerId)).leftJoin(users, eq(users.id, partners.userId)).where(eq(leads.id, id));
  if (!row) notFound();
  const { l, s, p, u } = row;
  const [convs, comms, events, [link], terms] = await Promise.all([
    db.select().from(conversions).where(eq(conversions.leadId, id)).orderBy(asc(conversions.createdAt)),
    db.select().from(commissions).where(eq(commissions.leadId, id)).orderBy(asc(commissions.createdAt)),
    db.select().from(leadEvents).where(eq(leadEvents.leadId, id)).orderBy(desc(leadEvents.createdAt)),
    l.linkId ? db.select({ token: referralLinks.token, asset: contentAssets.title, stage: referralLinks.stage, campaign: referralLinks.campaign }).from(referralLinks).innerJoin(contentAssets, eq(contentAssets.id, referralLinks.assetId)).where(eq(referralLinks.id, l.linkId)) : Promise.resolve([]),
    p ? db.select().from(partnerServiceTerms).where(eq(partnerServiceTerms.partnerId, p.id)) : Promise.resolve([]),
  ]);
  const term = terms.find((t) => t.serviceId === s.id);
  const rate = effectiveRate(s, term, env.demoMode);
  const sale = convs.find((c) => c.type === "sale");
  const needsManual = !rate.usable;

  return (
    <>
      <PageHeader title={`Lead ${leadRef(l.number)}`} sub={<Link href="/admin/polecenia" className="underline">← Wszystkie leady</Link>}><LeadStatusBadge status={l.status} /></PageHeader>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Klient i źródło">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">Usługa</dt><dd className="font-semibold">{s.name}</dd>
            <dt className="text-muted">Klient</dt><dd>{l.contactName ?? "—"}</dd>
            <dt className="text-muted">E-mail</dt><dd>{l.contactEmail ?? "—"}</dd>
            <dt className="text-muted">Telefon</dt><dd>{l.contactPhone ?? "—"}</dd>
            <dt className="text-muted">Źródło</dt><dd>{l.source}{l.stage && ` · ${stageLabel[l.stage]}`}{l.externalId && ` · ID: ${l.externalId}`}</dd>
            <dt className="text-muted">Zgoda</dt><dd>{l.consentAt ? fmtDateTime(l.consentAt) : "—"}</dd>
            <dt className="text-muted">Link</dt><dd>{link ? <>{link.asset}{link.campaign && ` (${link.campaign})`} <span className="tabular text-xs text-muted">/r/{link.token}</span></> : "—"}</dd>
          </dl>
          {s.sensitive && <Notice tone="neutral" className="mt-3">Usługa wrażliwa: nie zapisuj tu informacji o zdrowiu ani sytuacji rodzinnej klienta. Partner nie widzi żadnych danych klienta.</Notice>}
        </Panel>

        <Panel title="Partner i atrybucja">
          {p && u ? (
            <p className="text-sm"><Link href={`/admin/partnerzy/${p.id}`} className="font-bold hover:underline">{u.firstName} {u.lastName}</Link> <span className="tabular text-muted">{partnerId(p.number)}</span>
              <span className="mt-1 block text-muted">{l.attributionId ? "Przypisany automatycznie na podstawie linku polecającego." : "Przypisany ręcznie."}</span></p>
          ) : <p className="text-sm text-muted">Lead nie ma przypisanego partnera.</p>}
          <p className="mt-3 text-sm">Obowiązująca stawka: <Rate rate={displayRate(s, term, env.demoMode)} size="sm" /> <span className="text-xs text-muted">({modelLabel[rate.model]})</span></p>
          <ActionForm action={assignPartnerAction} className="mt-4 border-t border-line pt-4" confirm="Zmienić przypisanie partnera? Zmiana zostanie zapisana w historii.">
            <input type="hidden" name="leadId" value={l.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Partner (PP-…)" hint="Puste = usuń przypisanie"><input name="partnerNumber" defaultValue={p ? partnerId(p.number) : ""} className={inputCls} /></Field>
              <Field label="Powód korekty (wymagany)"><input name="reason" required className={inputCls} /></Field>
            </div>
            <SubmitButton small variant="secondary" className="mt-3">Zmień przypisanie</SubmitButton>
          </ActionForm>
        </Panel>

        <Panel title="Status klienta">
          <ActionForm action={setLeadStatusAction}>
            <input type="hidden" name="leadId" value={l.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status">
                <select name="status" defaultValue={l.status === "won" ? "in_progress" : l.status} className={inputCls} data-testid="lead-status">
                  {Object.entries(leadStatusLabel).filter(([v]) => v !== "won").map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}
                </select>
              </Field>
              <Field label="Notatka"><input name="note" className={inputCls} /></Field>
            </div>
            <SubmitButton small variant="secondary" className="mt-3" data-testid="lead-status-save">Zapisz status</SubmitButton>
          </ActionForm>
          {triggerFor(rate.model) === "qualified_lead" && <p className="mt-3 text-xs text-muted">Ta usługa rozlicza się za zakwalifikowany lead — ustawienie statusu „Lead zakwalifikowany” naliczy prowizję.</p>}
        </Panel>

        <Panel title="Sprzedaż i prowizja">
          {!sale ? (
            <ActionForm action={confirmSaleAction} confirm="Potwierdzić sprzedaż dla tego leada?">
              <input type="hidden" name="leadId" value={l.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Wartość netto sprzedaży (zł)" hint={rate.model === "percent" ? "Wymagana w modelu procentowym" : "Opcjonalnie"}><input name="netAmount" inputMode="decimal" className={inputCls} data-testid="net-amount" /></Field>
                <Field label="Prowizja ręczna (zł)" hint={needsManual ? "Stawka nieustalona — podaj kwotę, aby naliczyć" : "Puste = wg obowiązującej stawki"}><input name="manualCommission" inputMode="decimal" className={inputCls} /></Field>
              </div>
              <SubmitButton small className="mt-3" data-testid="confirm-sale">Potwierdź sprzedaż</SubmitButton>
            </ActionForm>
          ) : <p className="text-sm text-muted">Sprzedaż została już zapisana — ponowne potwierdzenie nie jest możliwe.</p>}

          {convs.map((c) => {
            const mine = comms.filter((x) => x.conversionId === c.id);
            const live = mine.find((x) => x.kind === "commission" && x.status !== "cancelled");
            return (
              <div key={c.id} className="mt-4 rounded-xl border border-line p-3.5">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold">{c.type === "sale" ? "Sprzedaż" : "Zakwalifikowany lead"} <Badge tone={c.status === "confirmed" ? "ok" : "danger"}>{c.status === "confirmed" ? "Potwierdzona" : "Zwrot"}</Badge>
                  <span className="font-normal text-muted">{fmtDateTime(c.occurredAt)}{c.netAmount != null && ` · netto ${formatPLN(c.netAmount)}`}</span></p>
                {mine.map((m) => (
                  <div key={m.id} className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-cream px-3 py-2 text-sm" data-testid="commission-row">
                    <span><b className="tabular">{formatPLN(m.amount)}</b> {m.kind === "correction" && <Badge tone="danger">korekta</Badge>} <CommissionStatusBadge status={m.status} />
                      <span className="block text-xs text-muted">stawka z chwili naliczenia: {m.rateSource === "manual" ? "ręcznie" : m.model === "percent" ? `${(m.rateBps ?? 0) / 100}%` : formatPLN(m.rateAmount ?? 0)} ({m.rateSource}){m.note && ` · ${m.note}`}</span></span>
                    <span className="flex gap-2">
                      {m.status === "pending" && <ActionForm action={commissionStatusAction}><input type="hidden" name="commissionId" value={m.id} /><input type="hidden" name="to" value="approved" /><SubmitButton small data-testid="approve-commission">Zatwierdź</SubmitButton></ActionForm>}
                      {m.status === "approved" && m.kind === "commission" && <ActionForm action={commissionStatusAction}><input type="hidden" name="commissionId" value={m.id} /><input type="hidden" name="to" value="pending" /><SubmitButton small variant="ghost">Cofnij zatwierdzenie</SubmitButton></ActionForm>}
                    </span>
                  </div>
                ))}
                {c.status === "confirmed" && !live && (
                  <ActionForm action={accrueManualAction} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="conversionId" value={c.id} />
                    <Field label="Nalicz prowizję (zł)" hint="Puste = wg obowiązującej stawki"><input name="amount" inputMode="decimal" className={`${inputCls} max-w-[180px]`} /></Field>
                    <SubmitButton small variant="secondary">Nalicz</SubmitButton>
                  </ActionForm>
                )}
                {c.status === "confirmed" && (
                  <details className="mt-3"><summary className="text-sm font-semibold text-danger">Zwrot / anulowanie sprzedaży</summary>
                    <ActionForm action={refundAction} className="mt-2 flex flex-wrap items-end gap-2" confirm="Zapisać zwrot? Prowizja zostanie anulowana lub skorygowana.">
                      <input type="hidden" name="conversionId" value={c.id} />
                      <Field label="Powód"><input name="reason" required className={inputCls} /></Field>
                      <SubmitButton small variant="danger">Zapisz zwrot</SubmitButton>
                    </ActionForm>
                  </details>
                )}
              </div>
            );
          })}
        </Panel>
      </div>

      <Panel title="Historia zmian" className="mt-5">
        <ol className="space-y-2 text-sm">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-x-3 border-b border-line pb-2 last:border-0">
              <span className="tabular w-36 shrink-0 text-muted">{fmtDateTime(e.createdAt)}</span>
              <span className="font-semibold">{eventLabel[e.type] ?? e.type}</span>
              <span>{e.type === "assignment" ? "zmiana partnera" : [e.fromValue, e.toValue].filter(Boolean).map((v) => leadStatusLabel[v!] ?? v).join(" → ")}</span>
              {e.note && <span className="text-muted">— {e.note}</span>}
              <span className="ml-auto text-xs text-muted">{e.actorLabel}</span>
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}
