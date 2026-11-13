import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { commissionStatusAction, payPartnerAction } from "@/app/actions/admin";
import { PageHeader, Panel, Table } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/client";
import { CommissionStatusBadge } from "@/components/status";
import { Badge, Field, btnSm, inputCls } from "@/components/ui";
import { db } from "@/db";
import { commissions, leads, partners, payouts, services, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatPLN } from "@/lib/commission";
import { commissionStatusLabel, fmtDate, leadRef, partnerId } from "@/lib/labels";

export default async function AdminCommissions({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status = "" } = await searchParams;
  const rows = await db.select({ c: commissions, lead: leads.number, leadId: leads.id, service: services.name, pNumber: partners.number, pId: partners.id, first: users.firstName, last: users.lastName })
    .from(commissions).innerJoin(leads, eq(leads.id, commissions.leadId)).innerJoin(services, eq(services.id, commissions.serviceId))
    .innerJoin(partners, eq(partners.id, commissions.partnerId)).innerJoin(users, eq(users.id, partners.userId))
    .where(status in commissionStatusLabel ? eq(commissions.status, status as "pending") : undefined).orderBy(desc(commissions.createdAt)).limit(300);
  const due = await db.select({ pId: partners.id, number: partners.number, first: users.firstName, last: users.lastName, total: sql<number>`sum(${commissions.amount})::bigint`, n: sql<number>`count(*)::int` })
    .from(commissions).innerJoin(partners, eq(partners.id, commissions.partnerId)).innerJoin(users, eq(users.id, partners.userId))
    .where(eq(commissions.status, "approved")).groupBy(partners.id, partners.number, users.firstName, users.lastName);
  const history = await db.select({ p: payouts, number: partners.number, first: users.firstName, last: users.lastName }).from(payouts)
    .innerJoin(partners, eq(partners.id, payouts.partnerId)).innerJoin(users, eq(users.id, partners.userId)).orderBy(desc(payouts.paidAt)).limit(30);

  return (
    <>
      <PageHeader title="Prowizje i wypłaty"><a href="/admin/eksport/prowizje" className={btnSm()}>Eksport CSV</a></PageHeader>

      <Panel title="Do wypłaty (zatwierdzone)">
        {due.length === 0 ? <p className="text-sm text-muted">Brak zatwierdzonych prowizji czekających na wypłatę.</p> : (
          <div className="space-y-3">
            {due.map((d) => (
              <div key={d.pId} className="rounded-xl border border-line p-3.5" data-testid="payout-row">
                <p className="flex flex-wrap items-center justify-between gap-2"><span><Link href={`/admin/partnerzy/${d.pId}`} className="font-bold hover:underline">{d.first} {d.last}</Link> <span className="tabular text-sm text-muted">{partnerId(d.number)} · pozycji: {d.n}</span></span>
                  <b className="tabular text-lg text-leather-dark">{formatPLN(Number(d.total))}</b></p>
                {Number(d.total) > 0 ? (
                  <ActionForm action={payPartnerAction} className="mt-2 flex flex-wrap items-end gap-2" confirm={`Oznaczyć wypłatę ${formatPLN(Number(d.total))} jako zrealizowaną?`}>
                    <input type="hidden" name="partnerId" value={d.pId} />
                    <Field label="Tytuł / numer przelewu"><input name="reference" className={inputCls} placeholder="np. FV 12/2026" /></Field>
                    <SubmitButton small data-testid="mark-paid">Oznacz jako wypłacone</SubmitButton>
                  </ActionForm>
                ) : <p className="mt-1 text-xs text-danger">Saldo ujemne po korektach — zostanie potrącone z kolejnych prowizji.</p>}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="mb-3 mt-6 flex flex-wrap gap-2">
        {[["", "Wszystkie"], ...Object.entries(commissionStatusLabel)].map(([v, l]) => (
          <Link key={v} href={`/admin/prowizje${v ? `?status=${v}` : ""}`} className={cn("inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm font-semibold", status === v ? "border-leather bg-leather text-white" : "border-line bg-white")}>{l}</Link>
        ))}
      </div>
      <Table head={["Data", "Partner", "Lead / usługa", "Kwota", "Status", "Akcje"]}>
        {rows.map(({ c, lead, leadId, service, pNumber, pId, first, last }) => (
          <tr key={c.id}>
            <td className="tabular whitespace-nowrap">{fmtDate(c.createdAt)}</td>
            <td><Link href={`/admin/partnerzy/${pId}`} className="font-semibold hover:underline">{first} {last}</Link><span className="tabular block text-xs text-muted">{partnerId(pNumber)}</span></td>
            <td><Link href={`/admin/polecenia/${leadId}`} className="tabular font-semibold hover:underline">{leadRef(lead)}</Link><span className="block text-xs text-muted">{service}</span></td>
            <td className={cn("tabular whitespace-nowrap font-bold", c.amount < 0 && "text-danger")}>{formatPLN(c.amount)}{c.kind === "correction" && <Badge tone="danger" className="ml-1">korekta</Badge>}</td>
            <td><CommissionStatusBadge status={c.status} />{c.note && <span className="mt-0.5 block max-w-[220px] text-xs text-muted">{c.note}</span>}</td>
            <td>
              <div className="flex flex-wrap gap-2">
                {c.status === "pending" && <ActionForm action={commissionStatusAction}><input type="hidden" name="commissionId" value={c.id} /><input type="hidden" name="to" value="approved" /><SubmitButton small>Zatwierdź</SubmitButton></ActionForm>}
                {(c.status === "pending" || c.status === "approved") && c.kind === "commission" && (
                  <details><summary className={btnSm("ghost")}>Anuluj…</summary>
                    <ActionForm action={commissionStatusAction} className="mt-2 flex gap-2"><input type="hidden" name="commissionId" value={c.id} /><input type="hidden" name="to" value="cancelled" />
                      <input name="reason" required placeholder="Powód" aria-label="Powód anulowania" className={`${inputCls} min-h-9 text-sm`} /><SubmitButton small variant="danger">Anuluj</SubmitButton></ActionForm>
                  </details>
                )}
              </div>
            </td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted">Brak prowizji. Naliczają się po potwierdzeniu sprzedaży lub zakwalifikowaniu leada.</td></tr>}
      </Table>

      <Panel title="Historia wypłat" className="mt-6">
        {history.length === 0 ? <p className="text-sm text-muted">Brak wypłat.</p> : (
          <Table head={["Data", "Partner", "Kwota", "Tytuł"]}>
            {history.map(({ p, number, first, last }) => <tr key={p.id}><td className="tabular">{fmtDate(p.paidAt)}</td><td>{first} {last} <span className="tabular text-xs text-muted">{partnerId(number)}</span></td><td className="tabular font-bold">{formatPLN(p.amount)}</td><td>{p.reference || "—"}</td></tr>)}
          </Table>
        )}
      </Panel>
    </>
  );
}
