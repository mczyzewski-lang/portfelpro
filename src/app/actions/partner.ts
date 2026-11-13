"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/client";
import { db } from "@/db";
import { partnerServiceTerms, partners, professions, services, users } from "@/db/schema";
import { requirePartner } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { DEMO_ACCOUNT } from "@/lib/demo";
import type { Stage } from "@/lib/labels";
import { getPublishedAssets } from "@/lib/queries";
import { assetTargetUrl, getOrCreateLink, recommendBlockLabel, recommendState } from "@/lib/tracking";
import { passwordSchema } from "@/lib/validation";

export async function setProfessionAction(fd: FormData) {
  const { partner } = await requirePartner();
  const slug = String(fd.get("profession") ?? "");
  const [p] = await db.select().from(professions).where(eq(professions.slug, slug));
  await db.update(partners).set({ professionSlug: p?.slug ?? null, onboardedAt: partner.onboardedAt ?? new Date() }).where(eq(partners.id, partner.id));
  revalidatePath("/app", "layout");
  redirect(String(fd.get("next") ?? "") === "konto" ? "/app/konto" : "/app/onboarding?krok=2");
}

export async function requestAccessAction(_: FormState, fd: FormData): Promise<FormState> {
  const { partner } = await requirePartner();
  if (partner.status !== "active") return { error: "Wniosek możesz złożyć po zatwierdzeniu konta." };
  const serviceId = String(fd.get("serviceId") ?? "");
  const [service] = await db.select().from(services).where(and(eq(services.id, serviceId), eq(services.status, "published")));
  if (!service || service.access !== "approval_required") return { error: "Ta usługa nie wymaga wniosku." };
  // Partner może wyłącznie złożyć wniosek — decyzję i stawki ustawia administrator.
  await db.insert(partnerServiceTerms).values({ partnerId: partner.id, serviceId, accessStatus: "requested" })
    .onConflictDoUpdate({
      target: [partnerServiceTerms.partnerId, partnerServiceTerms.serviceId],
      set: { accessStatus: "requested", updatedAt: new Date() },
      setWhere: isNull(partnerServiceTerms.accessStatus),
    });
  revalidatePath("/app", "layout");
  return { ok: "Wniosek wysłany. Damy znać, gdy współpraca zostanie zatwierdzona." };
}

export type ShareAsset = { id: string; stage: Stage; title: string; type: string; description: string; shareText: string; url: string; previewUrl: string };
export type ShareData = { ok: true; assets: ShareAsset[] } | { ok: false; message: string };

/** Zwraca osobiste linki partnera do wszystkich materiałów usługi (tworzy brakujące). */
export async function getShareData(serviceId: string): Promise<ShareData> {
  const { partner } = await requirePartner();
  const [service] = await db.select().from(services).where(eq(services.id, serviceId));
  if (!service) return { ok: false, message: "Nie znaleziono usługi." };
  const [term] = await db.select().from(partnerServiceTerms)
    .where(and(eq(partnerServiceTerms.partnerId, partner.id), eq(partnerServiceTerms.serviceId, serviceId)));
  const state = recommendState(partner, service, term);
  if (!state.can) return { ok: false, message: recommendBlockLabel[state.reason] };
  const assets = await getPublishedAssets(serviceId);
  const out: ShareAsset[] = [];
  for (const a of assets) {
    const link = await getOrCreateLink(partner, a.id);
    if (link.ok) out.push({
      id: a.id, stage: a.stage, title: a.title, type: a.type, description: a.description, shareText: a.shareText,
      url: link.url, previewUrl: assetTargetUrl(a, service.slug),
    });
  }
  return { ok: true, assets: out };
}

export async function createCampaignLinkAction(_: FormState, fd: FormData): Promise<FormState> {
  const { partner } = await requirePartner();
  const campaign = String(fd.get("campaign") ?? "").trim();
  if (!/^[\p{L}\p{N} _-]{2,40}$/u.test(campaign)) return { error: "Nazwa kampanii: 2–40 znaków (litery, cyfry, spacje, myślniki)." };
  const res = await getOrCreateLink(partner, String(fd.get("assetId") ?? ""), campaign);
  if (!res.ok) return { error: recommendBlockLabel[res.reason] ?? "Nie udało się utworzyć linku." };
  revalidatePath("/app/polecenia");
  return { ok: `Link kampanii „${campaign}”: ${res.url}` };
}

export async function dismissFirstSuccessAction() {
  const { partner } = await requirePartner();
  await db.update(partners).set({ firstSuccessSeenAt: new Date() }).where(eq(partners.id, partner.id));
  revalidatePath("/app");
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const { user } = await requirePartner();
  if (user.email === DEMO_ACCOUNT.email) return { error: "Na koncie demonstracyjnym nie można zmienić hasła." };
  if (!(await verifyPassword(String(fd.get("current") ?? ""), user.passwordHash))) return { error: "Obecne hasło jest nieprawidłowe." };
  const next = passwordSchema.safeParse(fd.get("next"));
  if (!next.success) return { error: next.error.issues[0].message };
  await db.update(users).set({ passwordHash: await hashPassword(next.data) }).where(eq(users.id, user.id));
  return { ok: "Hasło zostało zmienione." };
}
