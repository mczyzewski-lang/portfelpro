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
import { assetTargetUrl, createLead, getOrCreateLink, recommendBlockLabel, recommendState } from "@/lib/tracking";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { emailSchema, passwordSchema } from "@/lib/validation";

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

const handoffSchema = z.object({
  name: z.string().trim().min(2, "Podaj imię i nazwisko klienta").max(120),
  phone: z.string().trim().max(40).optional(),
  email: z.union([z.literal(""), emailSchema]).optional(),
  consent: z.literal("on", { message: "Potwierdź, że klient zgodził się na przekazanie danych" }),
}).refine((v) => (v.phone && v.phone.replace(/\D/g, "").length >= 7) || v.email, { message: "Podaj telefon lub e-mail klienta" });

/** Partner przekazuje kontakt klienta do konsultacji — lead od razu przypisany do partnera. */
export async function submitClientAction(_: FormState, fd: FormData): Promise<FormState> {
  const { user, partner } = await requirePartner();
  if (!(await rateLimit(`handoff:${partner.id}`, 20, 3600))) return { error: "Zbyt wiele zgłoszeń w krótkim czasie. Spróbuj ponownie za chwilę." };
  const serviceId = String(fd.get("serviceId") ?? "");
  const [service] = await db.select().from(services).where(eq(services.id, serviceId));
  if (!service) return { error: "Nie znaleziono usługi." };
  const [term] = await db.select().from(partnerServiceTerms).where(and(eq(partnerServiceTerms.partnerId, partner.id), eq(partnerServiceTerms.serviceId, serviceId)));
  const state = recommendState(partner, service, term);
  if (!state.can) return { error: recommendBlockLabel[state.reason] };
  const parsed = handoffSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { lead, duplicate } = await createLead({
    serviceId, source: "partner", stage: "consultation", partnerId: partner.id,
    contact: { name: parsed.data.name, email: parsed.data.email || null, phone: parsed.data.phone || null },
    consent: true, actor: { userId: user.id, label: `partner ${user.email}` },
  });
  // Nie ujawniamy, kto zgłosił klienta wcześniej — tylko że kontakt już jest w systemie.
  if (duplicate) return { error: "Ten klient jest już zgłoszony do tej usługi. Nie tworzymy drugiego zgłoszenia." };
  revalidatePath("/app", "layout");
  redirect(`/app/polecenia/${lead.id}?nowe=1`);
}
