"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { partners, professions, users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { hashPassword, randomSecret, randomToken } from "@/lib/crypto";
import { checkCode, issueCode, normalizePhone, PHONE_EMAIL_DOMAIN } from "@/lib/phone";
import { clientIpHash, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { isValidNip } from "@/lib/validation";

type Res = { error?: string; demoCode?: string | null; next?: "details" };

export async function requestCodeAction(rawPhone: string, termsAccepted: boolean): Promise<Res> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { error: "Podaj poprawny numer telefonu komórkowego (9 cyfr)." };
  if (!termsAccepted) return { error: "Zaakceptuj regulamin, aby kontynuować." };
  if (!(await rateLimit(`sms:${phone}`, 4, 900)) || !(await rateLimit(`sms-ip:${await clientIpHash()}`, 12, 3600))) return { error: "Zbyt wiele próśb o kod. Spróbuj ponownie za kilkanaście minut." };
  const res = await issueCode(phone);
  return res.ok ? { demoCode: res.demoCode } : { error: res.error };
}

/** Po wpisaniu kodu: istniejące konto → logowanie; nowy numer → krok z danymi (kod zostaje ważny do końca rejestracji). */
export async function verifyCodeAction(rawPhone: string, code: string): Promise<Res> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { error: "Nieprawidłowy numer telefonu." };
  const [existing] = await db.select().from(users).where(eq(users.loginPhone, phone));
  if (!(await checkCode(phone, code, !!existing))) return { error: "Kod jest nieprawidłowy lub wygasł." };
  if (existing) { await createSession(existing.id); redirect(existing.role === "admin" ? "/admin" : "/app"); }
  return { next: "details" };
}

export async function completeSignupAction(input: { phone: string; code: string; firstName: string; lastName: string; business: boolean; nip: string; profession: string }): Promise<Res> {
  const phone = normalizePhone(input.phone);
  if (!phone) return { error: "Nieprawidłowy numer telefonu." };
  const firstName = input.firstName.trim(), lastName = input.lastName.trim();
  if (firstName.length < 2 || lastName.length < 2) return { error: "Podaj imię i nazwisko." };
  const nip = input.nip.replace(/[\s-]/g, "");
  if (input.business && !isValidNip(nip)) return { error: "Podaj poprawny NIP (10 cyfr)." };
  if (!(await checkCode(phone, input.code, true))) return { error: "Kod wygasł. Poproś o nowy." };
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.loginPhone, phone));
  if (taken) return { error: "Ten numer ma już konto — zaloguj się kodem." };
  const cfg = await getSettings();
  const [profession] = input.profession ? await db.select().from(professions).where(eq(professions.slug, input.profession)) : [];
  const passwordHash = await hashPassword(randomSecret()); // konto bez hasła — logowanie wyłącznie kodem SMS
  const userId = await db.transaction(async (tx) => {
    const [u] = await tx.insert(users).values({ email: `${phone.slice(1)}${PHONE_EMAIL_DOMAIN}`, loginPhone: phone, passwordHash, role: "partner", firstName: firstName.slice(0, 80), lastName: lastName.slice(0, 80) }).returning();
    await tx.insert(partners).values({
      userId: u.id, status: cfg.auto_approve_partners ? "active" : "pending",
      activityType: input.business ? "sole_trader" : "individual", nip: input.business ? nip : null,
      professionSlug: profession?.slug ?? null, onboardedAt: profession ? new Date() : null,
      starterCode: randomToken(6).toUpperCase(), termsAcceptedAt: new Date(), termsVersion: cfg.terms_version,
    });
    return u.id;
  });
  await createSession(userId);
  redirect(profession ? "/app/onboarding?krok=2" : "/app/onboarding");
}
