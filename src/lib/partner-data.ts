import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { commissions, contentAssets, leads, referralClicks, referralLinks, services } from "@/db/schema";
import { count } from "./queries";

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
    serviceName: services.name,
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
