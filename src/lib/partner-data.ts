import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { commissions, contentAssets, leadEvents, leads, referralClicks, referralLinks, services } from "@/db/schema";
import { count } from "./queries";
import type { PartnerStats } from "./gamification";
import { commissionStatusLabel, leadStatusLabel } from "./labels";

/** Wszystkie zapytania poniżej są zawężone do partnerId — izolacja danych partnerów. */
export async function getWalletSummary(partnerId: string) {
  const sums = await db.select({ status: commissions.status, total: sql<number>`coalesce(sum(${commissions.amount}),0)::int` })
    .from(commissions).where(eq(commissions.partnerId, partnerId)).groupBy(commissions.status);
  const by = Object.fromEntries(sums.map((s) => [s.status, s.total])) as Record<string, number>;
  const [[clicks], [leadCount], [clients]] = await Promise.all([
    db.select({ n: count }).from(referralClicks).where(eq(referralClicks.partnerId, partnerId)),
    db.select({ n: count }).from(leads).where(eq(leads.partnerId, partnerId)),
    db.select({ n: count }).from(leads).where(and(eq(leads.partnerId, partnerId), eq(leads.status, "won"))),
  ]);
  return {
    pending: by.pending ?? 0, approved: by.approved ?? 0, paid: by.paid ?? 0,
    clicks: clicks.n, leads: leadCount.n, clients: clients.n,
  };
}

/** Historia poleceń: partner widzi tylko numer, usługę, status i prowizję — nigdy dane klienta. */
export async function getPartnerReferrals(partnerId: string, limit = 100) {
  const rows = await db.select({
    id: leads.id, number: leads.number, createdAt: leads.createdAt, status: leads.status, stage: leads.stage,
    serviceName: services.name, source: leads.source,
    clientName: sql<string | null>`case when ${leads.source} = 'partner' then ${leads.contactName} end`,
  }).from(leads).innerJoin(services, eq(services.id, leads.serviceId))
    .where(eq(leads.partnerId, partnerId)).orderBy(desc(leads.createdAt)).limit(limit);
  if (!rows.length) return [];
  const comms = await db.select({ leadId: commissions.leadId, amount: commissions.amount, status: commissions.status, kind: commissions.kind })
    .from(commissions).where(and(eq(commissions.partnerId, partnerId), inArray(commissions.leadId, rows.map((r) => r.id))));
  return rows.map((r) => {
    const mine = comms.filter((c) => c.leadId === r.id);
    const live = mine.filter((c) => c.status !== "cancelled");
    const main = mine.find((c) => c.kind === "commission" && c.status !== "cancelled") ?? mine.find((c) => c.kind === "commission");
    return { ...r, commissionAmount: live.reduce((s, c) => s + c.amount, 0), commissionStatus: main?.status ?? null, hasCorrection: mine.some((c) => c.kind === "correction") };
  });
}

export async function getPartnerCommissions(partnerId: string) {
  return db.select({
    id: commissions.id, amount: commissions.amount, status: commissions.status, kind: commissions.kind, createdAt: commissions.createdAt,
    paidAt: commissions.paidAt, leadNumber: leads.number, serviceName: services.name,
  }).from(commissions).innerJoin(leads, eq(leads.id, commissions.leadId)).innerJoin(services, eq(services.id, commissions.serviceId))
    .where(eq(commissions.partnerId, partnerId)).orderBy(desc(commissions.createdAt)).limit(200);
}

export async function getPartnerLinks(partnerId: string) {
  return db.select({
    id: referralLinks.id, token: referralLinks.token, stage: referralLinks.stage, campaign: referralLinks.campaign, createdAt: referralLinks.createdAt,
    assetTitle: contentAssets.title, serviceName: services.name, serviceSlug: services.slug,
    clicks: sql<number>`(select count(*)::int from referral_clicks rc where rc.link_id = "referral_links"."id")`,
    leads: sql<number>`(select count(*)::int from leads l where l.link_id = "referral_links"."id" and l.partner_id = "referral_links"."partner_id")`,
  }).from(referralLinks).innerJoin(contentAssets, eq(contentAssets.id, referralLinks.assetId)).innerJoin(services, eq(services.id, referralLinks.serviceId))
    .where(eq(referralLinks.partnerId, partnerId)).orderBy(desc(referralLinks.createdAt)).limit(200);
}

export async function hasFirstSuccess(partnerId: string) {
  const [c] = await db.select({ n: count }).from(commissions)
    .where(and(eq(commissions.partnerId, partnerId), ne(commissions.status, "cancelled"), eq(commissions.kind, "commission")));
  return c.n > 0;
}

/* ---------- proces polecenia, dziennik zdarzeń, statystyki do poziomów ---------- */

export type FeedItem = { key: string; at: Date; tone: "neutral" | "ok" | "gold" | "danger"; kind: "click" | "lead" | "status" | "money"; title: string; detail: string; leadId?: string };

/** Zamienia wpis historii leada na zdarzenie zrozumiałe dla partnera. Notatki administratora nie są ujawniane. */
function describe(e: { type: string; toValue: string | null }): Pick<FeedItem, "tone" | "kind" | "title"> | null {
  if (e.type === "created") return { kind: "lead", tone: "gold", title: "Nowe polecenie" };
  if (e.type === "status" && e.toValue) {
    const tone = e.toValue === "won" ? "ok" : e.toValue === "rejected" || e.toValue === "cancelled" ? "danger" : "neutral";
    return { kind: "status", tone, title: leadStatusLabel[e.toValue] ?? e.toValue };
  }
  if (e.type === "commission" && e.toValue) {
    const tone = e.toValue === "cancelled" ? "danger" : e.toValue === "paid" ? "ok" : "gold";
    return { kind: "money", tone, title: `Prowizja: ${(commissionStatusLabel[e.toValue] ?? e.toValue).toLowerCase()}` };
  }
  if (e.type === "refund") return { kind: "money", tone: "danger", title: "Zwrot — prowizja skorygowana" };
  return null; // przypisania i wpisy techniczne
}

/** Dziennik „co się stało”: kliknięcia w linki oraz kolejne kroki poleceń i prowizji. */
export async function getActivity(partnerId: string, limit = 25): Promise<FeedItem[]> {
  const [clicks, events] = await Promise.all([
    db.select({ id: referralClicks.id, at: referralClicks.createdAt, asset: contentAssets.title, service: services.name })
      .from(referralClicks).innerJoin(referralLinks, eq(referralLinks.id, referralClicks.linkId))
      .innerJoin(contentAssets, eq(contentAssets.id, referralLinks.assetId)).innerJoin(services, eq(services.id, referralClicks.serviceId))
      .where(eq(referralClicks.partnerId, partnerId)).orderBy(desc(referralClicks.createdAt)).limit(limit),
    db.select({ id: leadEvents.id, at: leadEvents.createdAt, type: leadEvents.type, toValue: leadEvents.toValue, leadId: leads.id, number: leads.number, service: services.name })
      .from(leadEvents).innerJoin(leads, eq(leads.id, leadEvents.leadId)).innerJoin(services, eq(services.id, leads.serviceId))
      .where(eq(leads.partnerId, partnerId)).orderBy(desc(leadEvents.createdAt)).limit(limit * 2),
  ]);
  const items: FeedItem[] = clicks.map((c) => ({ key: `c${c.id}`, at: c.at, kind: "click", tone: "neutral", title: "Klient otworzył Twój link", detail: `${c.service} · ${c.asset}` }));
  for (const e of events) {
    const d = describe(e);
    if (d) items.push({ key: `e${e.id}`, at: e.at, ...d, detail: `${e.service} · L-${String(e.number).padStart(5, "0")}`, leadId: e.leadId });
  }
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

/** Pełny przebieg jednego polecenia. Zwraca null, jeśli lead nie należy do partnera. */
export async function getReferralDetail(partnerId: string, leadId: string) {
  if (!/^[0-9a-f-]{36}$/.test(leadId)) return null;
  const [row] = await db.select({ l: leads, serviceName: services.name, serviceSlug: services.slug, sensitive: services.sensitive })
    .from(leads).innerJoin(services, eq(services.id, leads.serviceId)).where(and(eq(leads.id, leadId), eq(leads.partnerId, partnerId)));
  if (!row) return null;
  const [events, comms, [link]] = await Promise.all([
    db.select({ id: leadEvents.id, at: leadEvents.createdAt, type: leadEvents.type, toValue: leadEvents.toValue }).from(leadEvents).where(eq(leadEvents.leadId, leadId)).orderBy(desc(leadEvents.createdAt)),
    db.select({ id: commissions.id, amount: commissions.amount, status: commissions.status, kind: commissions.kind }).from(commissions).where(and(eq(commissions.leadId, leadId), eq(commissions.partnerId, partnerId))),
    row.l.linkId ? db.select({ title: contentAssets.title }).from(referralLinks).innerJoin(contentAssets, eq(contentAssets.id, referralLinks.assetId)).where(eq(referralLinks.id, row.l.linkId)) : Promise.resolve([]),
  ]);
  const timeline = events.map((e) => ({ ...e, d: describe(e) })).filter((e) => e.d).map((e) => ({ id: e.id, at: e.at, ...e.d! }));
  const reached = new Set<string>(["registered", row.l.status, ...events.filter((e) => e.type === "status" && e.toValue).map((e) => e.toValue!)]);
  return {
    id: row.l.id, number: row.l.number, status: row.l.status, stage: row.l.stage, createdAt: row.l.createdAt, source: row.l.source,
    serviceName: row.serviceName, serviceSlug: row.serviceSlug, viaAsset: link?.title ?? null,
    // Dane klienta pokazujemy partnerowi tylko wtedy, gdy sam je przekazał.
    clientName: row.l.source === "partner" ? row.l.contactName : null,
    reached, timeline, commissions: comms,
  };
}

export async function getPartnerStats(partnerId: string): Promise<PartnerStats> {
  const sum = await getWalletSummary(partnerId);
  const [[svc], [stg], [hand]] = await Promise.all([
    db.select({ n: sql<number>`count(distinct ${referralClicks.serviceId})::int` }).from(referralClicks).where(eq(referralClicks.partnerId, partnerId)),
    db.select({ n: sql<number>`count(distinct ${referralLinks.stage})::int` }).from(referralClicks).innerJoin(referralLinks, eq(referralLinks.id, referralClicks.linkId)).where(eq(referralClicks.partnerId, partnerId)),
    db.select({ n: count }).from(leads).where(and(eq(leads.partnerId, partnerId), eq(leads.source, "partner"))),
  ]);
  return { clicks: sum.clicks, leads: sum.leads, clients: sum.clients, paid: sum.paid, servicesShared: svc.n, stagesUsed: stg.n, handoffs: hand.n };
}

/** Miejsce partnera w bieżącym miesiącu wg liczby poleceń — bez ujawniania danych innych partnerów. */
export async function getMonthlyRank(partnerId: string) {
  const rows = await db.select({ partnerId: leads.partnerId, n: count }).from(leads)
    .where(sql`${leads.partnerId} is not null and ${leads.createdAt} >= date_trunc('month', now())`).groupBy(leads.partnerId);
  const mine = rows.find((r) => r.partnerId === partnerId)?.n ?? 0;
  return { mine, position: mine ? rows.filter((r) => r.n > mine).length + 1 : null, active: rows.length };
}
