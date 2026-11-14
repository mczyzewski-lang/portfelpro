"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import type { FormState } from "@/components/client";
import { db } from "@/db";
import { contentAssets, services } from "@/db/schema";
import { SYSTEM_ACTOR } from "@/lib/audit";
import { clientIpHash, rateLimit } from "@/lib/rate-limit";
import { getPublicWallet } from "@/lib/public-wallet";
import { createLead, resolveAttribution, VISITOR_COOKIE } from "@/lib/tracking";
import { fieldErrors, leadFormSchema, publicLeadSchema } from "@/lib/validation";

/** Formularz kontaktowy / zamówienia na stronach demonstracyjnych. Rejestruje leada z atrybucją partnera. */
export async function submitLeadAction(_: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("website") ?? "")) return { ok: "Dziękujemy!" }; // honeypot
  if (!(await rateLimit(`lead:${await clientIpHash()}`, 6, 600))) return { error: "Zbyt wiele zgłoszeń. Spróbuj ponownie za kilka minut." };
  const parsed = leadFormSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Popraw zaznaczone pola.", fieldErrors: fieldErrors(parsed.error) };

  const [row] = await db.select({ asset: contentAssets, service: services }).from(contentAssets)
    .innerJoin(services, eq(services.id, contentAssets.serviceId))
    .where(and(eq(contentAssets.id, String(fd.get("assetId") ?? "")), eq(contentAssets.status, "published"), eq(services.status, "published")));
  if (!row || row.asset.stage === "education") return { error: "Formularz jest nieaktywny." };

  await createLead({
    serviceId: row.service.id,
    ref: String(fd.get("pp_ref") ?? "") || null,
    iqid: Number(String(fd.get("iqid") ?? "")) || null,
    visitorId: (await cookies()).get(VISITOR_COOKIE)?.value ?? null,
    stage: row.asset.stage, source: "form",
    contact: { name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone },
    consent: true,
    actor: SYSTEM_ACTOR("formularz demo"),
  });
  // Ta sama odpowiedź dla nowego i powtórnego zgłoszenia — nie ujawniamy, czy kontakt już istnieje.
  return { ok: "Dziękujemy! Specjalista skontaktuje się z Tobą." };
}

/** Formularz kontaktowy w Portfelu Publicznym: klient zostawia kontakt przy konkretnej usłudze polecanej przez partnera. */
export async function submitPublicLeadAction(_: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("website") ?? "")) return { ok: "Dziękujemy!" }; // honeypot
  if (!(await rateLimit(`lead:${await clientIpHash()}`, 6, 600))) return { error: "Zbyt wiele zgłoszeń. Spróbuj ponownie za kilka minut." };
  const parsed = publicLeadSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const wallet = await getPublicWallet(String(fd.get("slug") ?? ""));
  const item = wallet?.items.find((i) => i.id === String(fd.get("serviceId") ?? ""));
  if (!wallet || !item) return { error: "Ten formularz jest już nieaktywny." };

  // Reguła pierwszego partnera: jeśli klient ma już ważną atrybucję dla tej usługi, zostaje przy niej.
  const visitorId = (await cookies()).get(VISITOR_COOKIE)?.value ?? null;
  const existing = await resolveAttribution(item.id, null, visitorId);
  await createLead({
    serviceId: item.id, stage: "consultation", source: "form", visitorId,
    partnerId: existing ? null : wallet.partnerId,
    contact: { name: parsed.data.name, email: parsed.data.email || null, phone: parsed.data.phone || null },
    consent: true, actor: SYSTEM_ACTOR("portfel publiczny"),
  });
  return { ok: "Dziękujemy! Specjalista skontaktuje się z Tobą." };
}
