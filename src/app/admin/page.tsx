import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Panel, Stat, Table } from "@/components/admin";
import { Notice } from "@/components/ui";
import { db } from "@/db";
import { commissions, conversions, leads, partners, referralClicks, services, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatPLN } from "@/lib/commission";
import { partnerId, stageLabel } from "@/lib/labels";
import { count } from "@/lib/queries";

export default async function AdminDashboard() {
  await requireAdmin();
  const [[p], [active], [pending], [clicks], [leadCount], [attributed], [sales], comm] = await Promise.all([
    db.select({ n: count }).from(partners),
    db.select({ n: sql<number>`count(distinct ${referralClicks.partnerId})::int` }).from(referralClicks).where(sql`${referralClicks.createdAt} > now() - interval '30 days'`),
    db.select({ n: count }).from(partners).where(eq(partners.status, "pending")),
    db.select({ n: count }).from(referralClicks),
    db.select({ n: count }).from(leads),
    db.select({ n: count }).from(leads).where(sql`${leads.partnerId} is not null`),
    db.select({ n: count, total: sql<number>`coalesce(sum(${conversions.netAmount}),0)::bigint` }).from(conversions)
      .innerJoin(leads, eq(leads.id, conversions.leadId)).where(sql`${conversions.type} = 'sale' and ${conversions.status} = 'confirmed' and ${leads.partnerId} is not null`),
    db.select({ status: commissions.status, total: sql<number>`coalesce(sum(${commissions.amount}),0)::bigint` }).from(commissions).groupBy(commissions.status),
  ]);
  const c = Object.fromEntries(comm.map((x) => [x.status, Number(x.total)]));

  const byService = await db.select({
    id: services.id, name: services.name,
    clicks: sql<number>`(select count(*)::int from referral_clicks rc where rc.service_id = "services"."id")`,
    leads: sql<number>`(select count(*)::int from leads l where l.service_id = "services"."id" and l.partner_id is not null)`,
    won: sql<number>`(select count(*)::int from leads l where l.service_id = "services"."id" and l.partner_id is not null and l.status = 'won')`,
    commission: sql<number>`(select coalesce(sum(amount),0)::bigint from commissions c where c.service_id = "services"."id" and c.status <> 'cancelled')`,
  }).from(services).orderBy(desc(sql`4`), desc(sql`3`));

  const stages = await db.execute<{ stage: string; clicks: number; leads: number }>(sql`
    select rl.stage::text as stage,
      (select count(*)::int from referral_clicks rc join referral_links l2 on l2.id = rc.link_id where l2.stage = rl.stage) as clicks,
      (select count(*)::int from leads l where l.stage = rl.stage and l.partner_id is not null) as leads
    from referral_links rl group by rl.stage order by rl.stage`);

  const top = await db.select({
    id: partners.id, number: partners.number, first: users.firstName, last: users.lastName,
    clicks: sql<number>`(select count(*)::int from referral_clicks rc where rc.partner_id = "partners"."id")`,
    leads: sql<number>`(select count(*)::int from leads l where l.partner_id = "partners"."id")`,
    commission: sql<number>`(select coalesce(sum(amount),0)::bigint from commissions c where c.partner_id = "partners"."id" and c.status <> 'cancelled')`,
  }).from(partners).innerJoin(users, eq(users.id, partners.userId)).orderBy(desc(sql`6`), desc(sql`5`)).limit(8);

  return (
    <>
      <PageHeader title="Pulpit" sub="Wyłącznie dane faktycznie zarejestrowane w systemie." />
      {pending.n > 0 && <Notice className="mb-4"><Link href="/admin/partnerzy?status=pending" className="underline">Partnerzy czekający na zatwierdzenie: {pending.n}</Link></Notice>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Partnerzy" value={p.n} hint={`${pending.n} oczekuje`} />
        <Stat label="Aktywni partnerzy (30 dni)" value={active.n} hint="z co najmniej 1 kliknięciem" />
        <Stat label="Kliknięcia" value={clicks.n} />
        <Stat label="Leady" value={leadCount.n} hint={`${attributed.n} przypisanych partnerom`} />
        <Stat label="Sprzedaż przypisana partnerom" value={sales.n} hint={`${formatPLN(Number(sales.total))} netto`} />
        <Stat label="Prowizje oczekujące" value={formatPLN(c.pending ?? 0)} />
        <Stat label="Prowizje zatwierdzone" value={formatPLN(c.approved ?? 0)} />
        <Stat label="Prowizje wypłacone" value={formatPLN(c.paid ?? 0)} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Skuteczność usług">
          <Table head={["Usługa", "Klik.", "Leady", "Sprzedaż", "Konw.", "Prowizje"]}>
            {byService.map((s) => (
              <tr key={s.id}>
                <td className="font-semibold"><Link href={`/admin/uslugi/${s.id}`} className="hover:underline">{s.name}</Link></td>
                <td className="tabular">{s.clicks}</td><td className="tabular">{s.leads}</td><td className="tabular">{s.won}</td>
                <td className="tabular">{s.clicks ? `${Math.round((s.leads / s.clicks) * 100)}%` : "—"}</td>
                <td className="tabular">{formatPLN(Number(s.commission))}</td>
              </tr>
            ))}
          </Table>
        </Panel>
        <div className="space-y-5">
          <Panel title="Źródła poleceń (etap wejścia)">
            {stages.length === 0 ? <p className="text-sm text-muted">Brak danych — nie utworzono jeszcze linków.</p> : (
              <Table head={["Etap", "Kliknięcia", "Leady"]}>
                {stages.map((s) => <tr key={s.stage}><td className="font-semibold">{stageLabel[s.stage as keyof typeof stageLabel]}</td><td className="tabular">{s.clicks}</td><td className="tabular">{s.leads}</td></tr>)}
              </Table>
            )}
          </Panel>
          <Panel title="Ranking partnerów">
            <Table head={["Partner", "Klik.", "Leady", "Prowizje"]}>
              {top.map((t) => (
                <tr key={t.id}>
                  <td><Link href={`/admin/partnerzy/${t.id}`} className="font-semibold hover:underline">{t.first} {t.last}</Link><span className="tabular block text-xs text-muted">{partnerId(t.number)}</span></td>
                  <td className="tabular">{t.clicks}</td><td className="tabular">{t.leads}</td><td className="tabular">{formatPLN(Number(t.commission))}</td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>
      </div>
    </>
  );
}
