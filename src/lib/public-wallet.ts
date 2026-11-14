import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, contentAssets, partnerServiceTerms, partners, services, users } from "@/db/schema";
import { expertOf } from "./expert";
import { getOrCreateLink, recommendState } from "./tracking";

const CAMPAIGN = "portfel publiczny";

/** Dane strony /p/<slug>: partner (tylko to, co sam upublicznia) i usługi, które może polecać, z jego linkami. */
export async function getPublicWallet(slug: string) {
  if (!/^[A-Za-z0-9-]{3,90}$/.test(slug)) return null;
  const [row] = await db.select({ p: partners, firstName: users.firstName, lastName: users.lastName })
    .from(partners).innerJoin(users, eq(users.id, partners.userId))
    .where(and(eq(partners.publicSlug, slug), eq(partners.publicEnabled, true), eq(partners.status, "active")));
  if (!row) return null;
  const terms = await db.select().from(partnerServiceTerms).where(eq(partnerServiceTerms.partnerId, row.p.id));
  const list = await db.select({ s: services, c: companies }).from(services).innerJoin(companies, eq(companies.id, services.companyId))
    .where(and(eq(services.status, "published"), eq(companies.published, true))).orderBy(asc(services.sort));
  const items = [];
  for (const { s, c } of list) {
    if (!recommendState(row.p, s, terms.find((t) => t.serviceId === s.id)).can) continue;
    const assets = await db.select().from(contentAssets)
      .where(and(eq(contentAssets.serviceId, s.id), eq(contentAssets.status, "published"))).orderBy(asc(contentAssets.sort));
    const link = async (stage: "education" | "consultation") => {
      const a = assets.find((x) => x.stage === stage);
      const res = a ? await getOrCreateLink(row.p, a.id, CAMPAIGN) : null;
      return res?.ok ? `/r/${res.token}` : null;
    };
    const [learn, talk] = [await link("education"), await link("consultation")];
    if (!learn && !talk) continue;
    items.push({
      id: s.id, slug: s.slug, name: s.name, benefit: s.clientBenefit, learn, talk, sensitive: s.sensitive,
      // tylko treści dla klienta — bez wskazówek sprzedażowych i prowizji
      expert: expertOf(s),
      description: s.description, problems: s.problems, audience: s.audience, faq: s.faq, provider: s.provider,
      company: { name: c.name, color: c.color, iconUrl: c.iconUrl, googleRating: c.googleRating, googleReviews: c.googleReviews },
    });
  }
  return {
    partnerId: row.p.id, name: `${row.firstName} ${row.lastName}`, initials: `${row.firstName[0] ?? ""}${row.lastName[0] ?? ""}`.toUpperCase(),
    bio: row.p.publicBio, companyName: row.p.companyName, hasPhoto: !!row.p.avatar, photoVersion: row.p.avatarUpdatedAt?.getTime() ?? 1, items,
  };
}

export type PublicWalletData = NonNullable<Awaited<ReturnType<typeof getPublicWallet>>>;
