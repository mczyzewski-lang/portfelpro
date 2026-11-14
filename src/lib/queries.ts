import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies, contentAssets, partnerServiceTerms, professions, serviceProfessions, services, type PartnerServiceTerm } from "@/db/schema";
import { displayRate, type RateDisplay } from "./commission";
import { env } from "./env";

export type CatalogItem = {
  id: string; slug: string; name: string; category: string; hook: string | null; clientBenefit: string; audienceShort: string;
  commissionCondition: string; access: "open" | "approval_required";
  company: { name: string; color: string; logoUrl: string | null; iconUrl: string | null; slug: string; googleRating: number | null; googleReviews: number | null };
  rate: RateDisplay;
  professions: { slug: string; reason: string }[];
};

/** Opublikowane usługi opublikowanych spółek — wspólne dla landingu i panelu partnera. */
export async function getCatalog(terms: PartnerServiceTerm[] = []): Promise<CatalogItem[]> {
  const rows = await db.select({ s: services, c: companies }).from(services)
    .innerJoin(companies, eq(companies.id, services.companyId))
    .where(and(eq(services.status, "published"), eq(companies.published, true)))
    .orderBy(asc(services.sort), asc(services.name));
  const sp = await db.select().from(serviceProfessions);
  const termBy = new Map(terms.map((t) => [t.serviceId, t]));
  return rows.map(({ s, c }) => ({
    id: s.id, slug: s.slug, name: s.name, category: s.category, hook: s.hook, clientBenefit: s.clientBenefit, audienceShort: s.audienceShort,
    commissionCondition: s.commissionCondition, access: s.access,
    company: { name: c.name, color: c.color, logoUrl: c.logoUrl, iconUrl: c.iconUrl, slug: c.slug, googleRating: c.googleRating, googleReviews: c.googleReviews },
    rate: displayRate(s, termBy.get(s.id), env.demoMode),
    professions: sp.filter((x) => x.serviceId === s.id).map((x) => ({ slug: x.professionSlug, reason: x.reason })),
  }));
}

export const getProfessions = () => db.select().from(professions).orderBy(asc(professions.sort));

export const getPartnerTerms = (partnerId: string) =>
  db.select().from(partnerServiceTerms).where(eq(partnerServiceTerms.partnerId, partnerId));

export async function getServiceBySlug(slug: string) {
  const [row] = await db.select({ s: services, c: companies }).from(services)
    .innerJoin(companies, eq(companies.id, services.companyId)).where(eq(services.slug, slug));
  return row ? { service: row.s, company: row.c } : null;
}

export const getPublishedAssets = (serviceId: string) =>
  db.select().from(contentAssets)
    .where(and(eq(contentAssets.serviceId, serviceId), eq(contentAssets.status, "published")))
    .orderBy(asc(contentAssets.sort), asc(contentAssets.createdAt));

export const count = sql<number>`count(*)::int`;
