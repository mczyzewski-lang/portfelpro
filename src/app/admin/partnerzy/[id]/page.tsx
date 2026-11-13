import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setPartnerManagerAction, setPartnerNoteAction, setPartnerStatusAction, setPartnerTermAction } from "@/app/actions/admin";
import { PageHeader, Panel, Stat, Table, textareaCls } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/client";
import { Rate } from "@/components/rate";
import { RateInputs } from "@/components/rate-inputs";
import { CommissionStatusBadge, LeadStatusBadge, PartnerStatusBadge } from "@/components/status";
import { Badge, Field, btnSm, inputCls } from "@/components/ui";
import { db } from "@/db";
import { partners, professions, services, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { displayRate, formatPLN } from "@/lib/commission";
import { env } from "@/lib/env";
import { accessLabel, activityLabel, fmtDate, leadRef, partnerId } from "@/lib/labels";
import { getPartnerReferrals, getWalletSummary } from "@/lib/partner-data";
import { listManagers } from "@/lib/messages";
import { getPartnerTerms } from "@/lib/queries";

export default async function PartnerDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db.select({ p: partners, u: users, prof: professions }).from(partners)
    .innerJoin(users, eq(users.id, partners.userId)).leftJoin(professions, eq(professions.slug, partners.professionSlug)).where(eq(partners.id, id));
  if (!row) notFound();
  const { p, u, prof } = row;
  const managers = await listManagers();
  const [sum, terms, allServices, referrals] = await Promise.all([
    getWalletSummary(p.id), getPartnerTerms(p.id), db.select().from(services).orderBy(asc(services.sort)), getPartnerReferrals(p.id, 30),
  ]);

  return (
    <>
      <PageHeader title={`${u.firstName} ${u.lastName}`} sub={<><span className="tabular">{partnerId(p.number)}</span> · {u.email}</>}>
        <PartnerStatusBadge status={p.status} />
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Kliknięcia" value={sum.clicks} /><Stat label="Leady" value={sum.leads} /><Stat label="Klienci" value={sum.clients} />
        <Stat label="Do wypłaty" value={formatPLN(sum.approved)} /><Stat label="Wypłacono" value={formatPLN(sum.paid)} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Konto">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">Forma</dt><dd>{activityLabel[p.activityType]}</dd>
            {p.companyName && <><dt className="text-muted">Firma</dt><dd>{p.companyName}</dd></>}
            {p.nip && <><dt className="text-muted">NIP</dt><dd className="tabular">{p.nip}</dd></>}
            <dt className="text-muted">Branża</dt><dd>{prof?.name ?? "—"}</dd>
            <dt className="text-muted">Dołączył</dt><dd>{fmtDate(p.createdAt)}</dd>
            <dt className="text-muted">Regulamin</dt><dd>{fmtDate(p.termsAcceptedAt)} ({p.termsVersion})</dd>
          </dl>
          <ActionForm action={setPartnerStatusAction} className="mt-4 border-t border-line pt-4">
            <input type="hidden" name="partnerId" value={p.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status konta">
                <select name="status" defaultValue={p.status} className={inputCls} data-testid="partner-status">
                  <option value="pending">Oczekuje na zatwierdzenie</option><option value="active">Aktywne</option><option value="suspended">Zawieszone</option>
                </select>
              </Field>
              <Field label="Powód (opcjonalnie)"><input name="reason" className={inputCls} /></Field>
            </div>
            <SubmitButton small variant="primary" className="mt-3" data-testid="partner-status-save">Zapisz status</SubmitButton>
          </ActionForm>
          <ActionForm action={setPartnerManagerAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
            <input type="hidden" name="partnerId" value={p.id} />
            <Field label="Opiekun partnera">
              <select name="managerUserId" defaultValue={p.managerUserId ?? ""} className={inputCls}>
                <option value="">Domyślny ({managers[0] ? `${managers[0].firstName} ${managers[0].lastName}` : "brak"})</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
            </Field>
            <SubmitButton small variant="secondary">Zapisz</SubmitButton>
            <Link href={`/admin/wiadomosci/${p.id}`} className={btnSm("primary")}>Napisz do partnera</Link>
          </ActionForm>
          <ActionForm action={setPartnerNoteAction} className="mt-4 border-t border-line pt-4">
            <input type="hidden" name="partnerId" value={p.id} />
            <Field label="Notatka wewnętrzna"><textarea name="note" rows={2} defaultValue={p.adminNote ?? ""} className={textareaCls} /></Field>
            <SubmitButton small variant="secondary" className="mt-2">Zapisz notatkę</SubmitButton>
          </ActionForm>
        </Panel>

        <Panel title="Ostatnie polecenia">
          {referrals.length === 0 ? <p className="text-sm text-muted">Brak poleceń.</p> : (
            <Table head={["Lead", "Usługa", "Status", "Prowizja"]}>
              {referrals.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/admin/polecenia/${r.id}`} className="tabular font-semibold hover:underline">{leadRef(r.number)}</Link><span className="block text-xs text-muted">{fmtDate(r.createdAt)}</span></td>
                  <td>{r.serviceName}</td><td><LeadStatusBadge status={r.status} /></td>
                  <td className="tabular">{r.commissionStatus ? <>{formatPLN(r.commissionAmount)}<span className="mt-0.5 block"><CommissionStatusBadge status={r.commissionStatus} /></span></> : "—"}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>

      <Panel title="Dostęp do usług i indywidualne stawki" className="mt-5">
        <p className="mb-3 text-sm text-muted">Stawka indywidualna zastępuje standardową tylko dla tego partnera i tylko dla przyszłych naliczeń.</p>
        <div className="space-y-2.5">
          {allServices.map((s) => {
            const t = terms.find((x) => x.serviceId === s.id);
            return (
              <details key={s.id} className="rounded-xl border border-line px-4 open:bg-cream/40" open={t?.accessStatus === "requested"}>
                <summary className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-2">
                  <span className="font-bold text-leather-dark">{s.name}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    {s.access === "approval_required" && <Badge tone={t?.accessStatus === "approved" ? "ok" : t?.accessStatus === "requested" ? "warn" : "neutral"}>{t?.accessStatus ? accessLabel[t.accessStatus] : "Wymaga zatwierdzenia"}</Badge>}
                    <Rate rate={displayRate(s, t, env.demoMode)} size="sm" />
                  </span>
                </summary>
                <ActionForm action={setPartnerTermAction} className="space-y-3 pb-4">
                  <input type="hidden" name="partnerId" value={p.id} /><input type="hidden" name="serviceId" value={s.id} />
                  <Field label="Dostęp do polecania" hint={s.access === "open" ? "Usługa otwarta — dostęp nie wymaga decyzji." : "Usługa regulowana — wymaga zatwierdzenia formy współpracy."}>
                    <select name="access" defaultValue={t?.accessStatus ?? ""} className={inputCls} data-testid={`access-${s.slug}`}>
                      <option value="">— brak decyzji —</option><option value="requested">Wniosek oczekuje</option><option value="approved">Zatwierdzony</option><option value="rejected">Odmowa</option>
                    </select>
                  </Field>
                  <label className="flex items-center gap-2.5 text-sm font-semibold"><input type="checkbox" name="useCustom" defaultChecked={!!t?.customModel} className="size-4 accent-leather" />Stawka indywidualna dla tego partnera</label>
                  <RateInputs model={t?.customModel ?? s.commissionModel} amount={t?.customAmount} bps={t?.customBps} />
                  <Field label="Notatka (np. podstawa ustaleń)"><input name="note" defaultValue={t?.note ?? ""} className={inputCls} /></Field>
                  <SubmitButton small data-testid={`term-save-${s.slug}`}>Zapisz warunki</SubmitButton>
                </ActionForm>
              </details>
            );
          })}
        </div>
      </Panel>
      <p className="mt-3 text-xs text-muted">Zmiany statusu i warunków są zapisywane w <Link href="/admin/dziennik" className="underline">dzienniku zmian</Link>.</p>
    </>
  );
}
