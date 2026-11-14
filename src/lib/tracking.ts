/**
 * Linki polecające, kliknięcia, atrybucja i rejestracja leadów.
 * Reguła atrybucji: pierwszy poprawnie przypisany partner w oknie atrybucji (first touch),
 * liczona osobno dla każdej usługi.
 */
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import {
  attributions, contentAssets, leadEvents, leads, partnerServiceTerms, partners, referralClicks,
  referralLinks, services, type ContentAsset, type Lead, type Partner, type Service,
} from "@/db/schema";
import type { Actor } from "./audit";
import { hmac, randomToken } from "./crypto";
import { env } from "./env";
import type { Stage } from "./labels";
import { getSetting } from "./settings";

export const REF_PARAM = "pp_ref";
export const VISITOR_COOKIE = "pp_vid";

/* ---------- uprawnienia do polecania ---------- */
export type RecommendState =
  | { can: true }
  | { can: false; reason: "account_pending" | "account_suspended" | "needs_access" | "access_requested" | "access_rejected" | "unpublished" };

export function recommendState(
  partner: Pick<Partner, "status">,
  service: Pick<Service, "status" | "access">,
  term: { accessStatus: "requested" | "approved" | "rejected" | null } | null | undefined,
): RecommendState {
  if (service.status !== "published") return { can: false, reason: "unpublished" };
  if (partner.status === "pending") return { can: false, reason: "account_pending" };
  if (partner.status === "suspended") return { can: false, reason: "account_suspended" };
  if (service.access === "approval_required") {
    if (term?.accessStatus === "approved") return { can: true };
    if (term?.accessStatus === "requested") return { can: false, reason: "access_requested" };
    if (term?.accessStatus === "rejected") return { can: false, reason: "access_rejected" };
    return { can: false, reason: "needs_access" };
  }
  return { can: true };
}

export const recommendBlockLabel: Record<string, string> = {
  account_pending: "Linki aktywują się po zatwierdzeniu Twojego konta",
  account_suspended: "Konto jest zawieszone — skontaktuj się z nami",
  needs_access: "Ta usługa wymaga zatwierdzenia współpracy",
  access_requested: "Wniosek o dostęp czeka na decyzję",
  access_rejected: "Współpraca przy tej usłudze nie została zatwierdzona",
  unpublished: "Usługa nie jest obecnie dostępna",
};

/* ---------- linki ---------- */
export const linkUrl = (token: string) => `${env.appUrl}/r/${token}`;

export async function getOrCreateLink(partner: Partner, assetId: string, campaign = ""): Promise<
  { ok: true; token: string; url: string } | { ok: false; reason: string }
> {
  const [row] = await db
    .select({ asset: contentAssets, service: services })
    .from(contentAssets)
    .innerJoin(services, eq(services.id, contentAssets.serviceId))
    .where(eq(contentAssets.id, assetId));
  if (!row || row.asset.status !== "published") return { ok: false, reason: "unpublished" };
  const [term] = await db.select().from(partnerServiceTerms)
    .where(and(eq(partnerServiceTerms.partnerId, partner.id), eq(partnerServiceTerms.serviceId, row.service.id)));
  const state = recommendState(partner, row.service, term);
  if (!state.can) return { ok: false, reason: state.reason };

  campaign = campaign.trim().slice(0, 60);
  for (let attempt = 0; attempt < 5; attempt++) {
    const token = randomToken(7);
    const inserted = await db.insert(referralLinks)
      .values({ token, partnerId: partner.id, serviceId: row.service.id, assetId, stage: row.asset.stage, campaign })
      .onConflictDoNothing()
      .returning({ token: referralLinks.token });
    if (inserted[0]) return { ok: true, token, url: linkUrl(token) };
    const [existing] = await db.select({ token: referralLinks.token }).from(referralLinks).where(and(
      eq(referralLinks.partnerId, partner.id), eq(referralLinks.assetId, assetId), eq(referralLinks.campaign, campaign)));
    if (existing) return { ok: true, token: existing.token, url: linkUrl(existing.token) };
    // kolizja tokenu — losujemy ponownie
  }
  return { ok: false, reason: "token_collision" };
}

/* ---------- kliknięcia ---------- */
const BOT_RE = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|slackbot|telegram|discord|linkedin|skype|curl|wget|python-requests|headless(?!chrome)|monitor|pingdom/i;
export const isBot = (ua: string | null) => !ua || BOT_RE.test(ua);

export function assetTargetUrl(asset: Pick<ContentAsset, "targetUrl" | "slug">, serviceSlug: string): string {
  return asset.targetUrl?.trim() || `${env.appUrl}/demo/${serviceSlug}/${asset.slug}`;
}

export const IQID_PARAM = "iqid";

export function withRef(url: string, refToken: string | null, iqid?: number | null): string {
  const u = new URL(url, env.appUrl);
  if (refToken) u.searchParams.set(REF_PARAM, refToken);
  if (refToken && iqid) u.searchParams.set(IQID_PARAM, String(iqid)); // IQ ID partnera widoczny w adresie
  if (u.origin !== new URL(env.appUrl).origin && !u.searchParams.has("utm_source")) {
    u.searchParams.set("utm_source", "portfel.pro");
    u.searchParams.set("utm_medium", "partner");
  }
  return u.toString();
}

export type ClickResult =
  | { ok: false }
  | { ok: true; redirectTo: string; visitorId: string | null; setCookieDays: number | null };

export async function handleClick(token: string, req: {
  visitorId: string | null; userAgent: string | null; ip: string | null; referer: string | null;
}): Promise<ClickResult> {
  if (!/^[A-Za-z0-9]{5,16}$/.test(token)) return { ok: false };
  const [row] = await db
    .select({ link: referralLinks, asset: contentAssets, service: services, partner: partners })
    .from(referralLinks)
    .innerJoin(contentAssets, eq(contentAssets.id, referralLinks.assetId))
    .innerJoin(services, eq(services.id, referralLinks.serviceId))
    .innerJoin(partners, eq(partners.id, referralLinks.partnerId))
    .where(eq(referralLinks.token, token));
  if (!row || row.asset.status !== "published" || row.service.status !== "published") return { ok: false };

  const target = assetTargetUrl(row.asset, row.service.slug);
  // Boty i podglądy linków (np. WhatsApp) oraz nieaktywni partnerzy: przekierowanie bez atrybucji i bez zliczania.
  if (isBot(req.userAgent) || row.partner.status !== "active") {
    return { ok: true, redirectTo: withRef(target, null), visitorId: null, setCookieDays: null };
  }

  const windowDays = await getSetting("attribution_window_days");
  const visitorId = req.visitorId && /^[A-Za-z0-9_-]{16,64}$/.test(req.visitorId) ? req.visitorId : randomToken(24);
  const now = new Date();

  // First touch: jeśli ten odwiedzający ma już ważną atrybucję dla tej usługi — zostaje przy pierwszym partnerze.
  let [attr] = await db.select().from(attributions)
    .where(and(eq(attributions.visitorId, visitorId), eq(attributions.serviceId, row.service.id), gt(attributions.expiresAt, now)))
    .orderBy(asc(attributions.createdAt)).limit(1);
  if (!attr) {
    [attr] = await db.insert(attributions).values({
      token: randomToken(20), visitorId, partnerId: row.partner.id, serviceId: row.service.id, linkId: row.link.id,
      expiresAt: new Date(now.getTime() + windowDays * 86400_000),
    }).returning();
  }

  // Proste odfiltrowanie wielokrotnych odświeżeń: jedno kliknięcie na odwiedzającego i link w ciągu 30 minut.
  const [recent] = await db.select({ id: referralClicks.id }).from(referralClicks).where(and(
    eq(referralClicks.linkId, row.link.id), eq(referralClicks.visitorId, visitorId),
    gt(referralClicks.createdAt, new Date(now.getTime() - 30 * 60_000)))).limit(1);
  if (!recent) {
    await db.insert(referralClicks).values({
      linkId: row.link.id, partnerId: row.partner.id, serviceId: row.service.id, attributionId: attr.id, visitorId,
      ipHash: req.ip ? hmac(`ip:${req.ip}`).slice(0, 32) : null,
      userAgent: req.userAgent?.slice(0, 300) ?? null,
      referer: req.referer ? safeOrigin(req.referer) : null,
    });
  }
  return { ok: true, redirectTo: withRef(target, attr.token, row.partner.number), visitorId, setCookieDays: windowDays };
}

function safeOrigin(url: string): string | null {
  try { return new URL(url).origin.slice(0, 200); } catch { return null; }
}

/* ---------- atrybucja ---------- */
export async function resolveAttribution(serviceId: string, ref: string | null | undefined, visitorId: string | null | undefined) {
  const now = new Date();
  let attr: typeof attributions.$inferSelect | undefined;
  if (ref && /^[A-Za-z0-9]{10,40}$/.test(ref)) {
    [attr] = await db.select().from(attributions)
      .where(and(eq(attributions.token, ref), eq(attributions.serviceId, serviceId), gt(attributions.expiresAt, now)));
  }
  if (!attr && visitorId) {
    [attr] = await db.select().from(attributions)
      .where(and(eq(attributions.visitorId, visitorId), eq(attributions.serviceId, serviceId), gt(attributions.expiresAt, now)))
      .orderBy(asc(attributions.createdAt)).limit(1);
  }
  if (!attr) return null;
  const [partner] = await db.select().from(partners).where(eq(partners.id, attr.partnerId));
  if (!partner || partner.status !== "active") return null;
  return attr;
}

/* ---------- leady ---------- */
export function contactHash(email?: string | null, phone?: string | null): string | null {
  const e = email?.trim().toLowerCase();
  const p = phone?.replace(/\D/g, "");
  const key = e || (p && p.length >= 7 ? p : null);
  return key ? hmac(`contact:${key}`) : null;
}

export type CreateLeadInput = {
  serviceId: string;
  ref?: string | null;
  visitorId?: string | null;
  stage?: Stage | null;
  source: "form" | "webhook" | "csv" | "manual" | "partner";
  externalId?: string | null;
  contact?: { name?: string | null; email?: string | null; phone?: string | null };
  consent?: boolean;
  /** IQ ID z adresu strony — używany, gdy nie ma tokenu ani wcześniejszej atrybucji */
  iqid?: number | null;
  partnerId?: string | null; // tylko ręczne przypisanie przez administratora / import
  actor: Actor;
};

export async function createLead(input: CreateLeadInput): Promise<{ lead: Lead; duplicate: boolean }> {
  const attr = input.partnerId ? null : await resolveAttribution(input.serviceId, input.ref, input.visitorId);
  // Sam IQ ID w linku wystarcza do przypisania — o ile partner jest aktywny i może polecać tę usługę.
  let iqPartnerId: string | null = null;
  if (!attr && !input.partnerId && input.iqid && Number.isInteger(input.iqid) && input.iqid > 0) {
    const [p] = await db.select().from(partners).where(eq(partners.number, input.iqid));
    const [svc] = await db.select().from(services).where(eq(services.id, input.serviceId));
    if (p && svc) {
      const [term] = await db.select().from(partnerServiceTerms).where(and(eq(partnerServiceTerms.partnerId, p.id), eq(partnerServiceTerms.serviceId, svc.id)));
      if (recommendState(p, svc, term).can) iqPartnerId = p.id;
    }
  }
  const hash = contactHash(input.contact?.email, input.contact?.phone);
  const externalId = input.externalId?.trim() || null;

  return db.transaction(async (tx) => {
    // Ochrona przed duplikatami: ten sam kontakt lub ten sam zewnętrzny identyfikator w ramach usługi = ten sam lead.
    if (externalId) {
      const [ex] = await tx.select().from(leads).where(and(eq(leads.serviceId, input.serviceId), eq(leads.externalId, externalId)));
      if (ex) return { lead: ex, duplicate: true };
    }
    if (hash) {
      const [ex] = await tx.select().from(leads).where(and(eq(leads.serviceId, input.serviceId), eq(leads.contactHash, hash)));
      if (ex) return { lead: ex, duplicate: true };
    }
    const [lead] = await tx.insert(leads).values({
      serviceId: input.serviceId,
      partnerId: input.partnerId ?? attr?.partnerId ?? iqPartnerId,
      attributionId: attr?.id ?? null,
      linkId: attr?.linkId ?? null,
      stage: input.stage ?? null,
      source: input.source,
      externalId,
      contactName: input.contact?.name?.trim().slice(0, 120) || null,
      contactEmail: input.contact?.email?.trim().toLowerCase().slice(0, 200) || null,
      contactPhone: input.contact?.phone?.trim().slice(0, 40) || null,
      contactHash: hash,
      consentAt: input.consent ? new Date() : null,
    }).returning();
    await tx.insert(leadEvents).values({
      leadId: lead.id, type: "created", toValue: "registered",
      note: input.source === "partner" ? "Kontakt przekazany przez partnera" : iqPartnerId ? "Przypisano na podstawie IQ ID w linku" : lead.partnerId ? (attr ? "Przypisano na podstawie linku polecającego" : "Przypisano ręcznie") : "Brak atrybucji partnera",
      actorUserId: input.actor.userId, actorLabel: input.actor.label,
    });
    return { lead, duplicate: false };
  });
}
