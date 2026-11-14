import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Table } from "@/components/admin";
import { PartnerStatusBadge } from "@/components/status";
import { btnSm, inputCls } from "@/components/ui";
import { db } from "@/db";
import { partners, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatPLN } from "@/lib/commission";
import { fmtDate, partnerId } from "@/lib/labels";

export default async function PartnersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdmin();
  const { q = "", status = "" } = await searchParams;
  const num = Number(q.replace(/\D/g, ""));
  const where = and(
    ["pending", "active", "suspended"].includes(status) ? eq(partners.status, status as "pending") : undefined,
    q ? or(ilike(users.email, `%${q}%`), ilike(users.lastName, `%${q}%`), ilike(users.firstName, `%${q}%`), ilike(partners.companyName, `%${q}%`), num ? eq(partners.number, num) : undefined) : undefined,
  );
  const rows = await db.select({
    p: partners, u: users,
    clicks: sql<number>`(select count(*)::int from referral_clicks rc where rc.partner_id = "partners"."id")`,
    leads: sql<number>`(select count(*)::int from leads l where l.partner_id = "partners"."id")`,
    commission: sql<number>`(select coalesce(sum(amount),0)::bigint from commissions c where c.partner_id = "partners"."id" and c.status <> 'cancelled')`,
    requests: sql<number>`(select count(*)::int from partner_service_terms t where t.partner_id = "partners"."id" and t.access_status = 'requested')`,
  }).from(partners).innerJoin(users, eq(users.id, partners.userId)).where(where).orderBy(desc(partners.createdAt)).limit(200);

  return (
    <>
      <PageHeader title="Partnerzy" sub={`${rows.length} wyników`}><a href="/admin/eksport/partnerzy" className={btnSm()}>Eksport CSV</a></PageHeader>
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Szukaj: nazwisko, e-mail, firma, iqid-…" aria-label="Szukaj partnera" className={`${inputCls} max-w-xs`} />
        <select name="status" defaultValue={status} aria-label="Status" className={`${inputCls} max-w-[220px]`}>
          <option value="">Wszystkie statusy</option><option value="pending">Oczekujące</option><option value="active">Aktywne</option><option value="suspended">Zawieszone</option>
        </select>
        <button className={btnSm("primary", "min-h-11")}>Filtruj</button>
      </form>
      <Table head={["Partner", "Status", "Dołączył", "Klik.", "Leady", "Prowizje", ""]}>
        {rows.map(({ p, u, clicks, leads, commission, requests }) => (
          <tr key={p.id}>
            <td><Link href={`/admin/partnerzy/${p.id}`} className="font-semibold hover:underline">{u.firstName} {u.lastName}</Link>
              <span className="block text-xs text-muted"><span className="tabular">{partnerId(p.number)}</span> · {u.email}{p.companyName && ` · ${p.companyName}`}</span></td>
            <td><PartnerStatusBadge status={p.status} />{requests > 0 && <span className="mt-1 block text-xs font-semibold text-warn">wnioski o dostęp: {requests}</span>}</td>
            <td className="tabular whitespace-nowrap">{fmtDate(p.createdAt)}</td>
            <td className="tabular">{clicks}</td><td className="tabular">{leads}</td><td className="tabular whitespace-nowrap">{formatPLN(Number(commission))}</td>
            <td><Link href={`/admin/partnerzy/${p.id}`} className={btnSm()}>Otwórz</Link></td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted">Brak partnerów dla tych kryteriów.</td></tr>}
      </Table>
    </>
  );
}
