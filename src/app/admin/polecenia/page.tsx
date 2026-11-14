import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import Link from "next/link";
import { createManualLeadAction } from "@/app/actions/admin";
import { PageHeader, Table } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/client";
import { LeadStatusBadge } from "@/components/status";
import { Badge, Field, btnSm, inputCls } from "@/components/ui";
import { db } from "@/db";
import { leads, partners, services, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatPLN } from "@/lib/commission";
import { fmtDate, leadRef, leadStatusLabel, partnerId } from "@/lib/labels";

export default async function AdminLeads({ searchParams }: { searchParams: Promise<{ status?: string; service?: string; partner?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const allServices = await db.select({ id: services.id, name: services.name }).from(services).orderBy(asc(services.sort));
  const where = and(
    sp.status && sp.status in leadStatusLabel ? eq(leads.status, sp.status as "registered") : undefined,
    sp.service && /^[0-9a-f-]{36}$/.test(sp.service) ? eq(leads.serviceId, sp.service) : undefined,
    sp.partner === "none" ? isNull(leads.partnerId) : undefined,
  );
  const rows = await db.select({
    l: leads, service: services.name, pNumber: partners.number, pFirst: users.firstName, pLast: users.lastName,
    commission: sql<number | null>`(select sum(amount)::bigint from commissions c where c.lead_id = "leads"."id" and c.status <> 'cancelled')`,
  }).from(leads).innerJoin(services, eq(services.id, leads.serviceId))
    .leftJoin(partners, eq(partners.id, leads.partnerId)).leftJoin(users, eq(users.id, partners.userId))
    .where(where).orderBy(desc(leads.createdAt)).limit(300);

  return (
    <>
      <PageHeader title="Leady i sprzedaż" sub={`${rows.length} wyników`}><a href="/admin/eksport/leady" className={btnSm()}>Eksport CSV</a></PageHeader>
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className={`${inputCls} max-w-[220px]`}><option value="">Wszystkie statusy</option>{Object.entries(leadStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select name="service" defaultValue={sp.service ?? ""} aria-label="Usługa" className={`${inputCls} max-w-[260px]`}><option value="">Wszystkie usługi</option>{allServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select name="partner" defaultValue={sp.partner ?? ""} aria-label="Atrybucja" className={`${inputCls} max-w-[220px]`}><option value="">Z partnerem i bez</option><option value="none">Bez przypisanego partnera</option></select>
        <button className={btnSm("primary", "min-h-11")}>Filtruj</button>
      </form>
      <Table head={["Lead", "Usługa", "Klient", "Partner", "Status", "Prowizja", ""]} data-testid="admin-leads">
        {rows.map(({ l, service, pNumber, pFirst, pLast, commission }) => (
          <tr key={l.id}>
            <td><Link href={`/admin/polecenia/${l.id}`} className="tabular font-semibold hover:underline">{leadRef(l.number)}</Link><span className="block text-xs text-muted">{fmtDate(l.createdAt)} · {l.source}</span></td>
            <td>{service}</td>
            <td>{l.contactName ?? "—"}<span className="block text-xs text-muted">{l.contactEmail}</span></td>
            <td>{pNumber ? <>{pFirst} {pLast}<span className="tabular block text-xs text-muted">{partnerId(pNumber)}</span></> : <Badge>brak</Badge>}</td>
            <td><LeadStatusBadge status={l.status} /></td>
            <td className="tabular whitespace-nowrap">{commission != null ? formatPLN(Number(commission)) : "—"}</td>
            <td><Link href={`/admin/polecenia/${l.id}`} className={btnSm()} data-testid="open-lead">Otwórz</Link></td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted">Brak leadów. Pojawią się po wysłaniu formularza, zdarzeniu z webhooka lub imporcie.</td></tr>}
      </Table>

      <details className="mt-5 rounded-2xl border border-line bg-white px-4">
        <summary className="flex min-h-12 items-center font-bold text-leather">+ Dodaj lead ręcznie</summary>
        <ActionForm action={createManualLeadAction} className="pb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Usługa"><select name="serviceId" className={inputCls}>{allServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            <Field label="Partner (IQ ID)" hint="Puste = bez partnera"><input name="partnerNumber" placeholder="iqid-101" className={inputCls} /></Field>
            <Field label="Imię i nazwisko klienta"><input name="name" className={inputCls} /></Field>
            <Field label="E-mail klienta"><input name="email" type="email" className={inputCls} /></Field>
            <Field label="Telefon"><input name="phone" className={inputCls} /></Field>
            <Field label="ID w systemie spółki (opcjonalnie)"><input name="externalId" className={inputCls} /></Field>
            <Field label="Powód ręcznego dodania" className="sm:col-span-2"><input name="reason" required className={inputCls} /></Field>
          </div>
          <SubmitButton small className="mt-3">Dodaj lead</SubmitButton>
        </ActionForm>
      </details>
    </>
  );
}
