"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/client";
import { db } from "@/db";
import { partners, users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { DEMO_ACCOUNT } from "@/lib/demo";
import { env } from "@/lib/env";
import { clientIpHash, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { emailSchema, fieldErrors, registerSchema } from "@/lib/validation";

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await rateLimit(`register:${await clientIpHash()}`, 8, 3600))) {
    return { error: "Zbyt wiele prób. Spróbuj ponownie za jakiś czas." };
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Popraw zaznaczone pola.", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const cfg = await getSettings();
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, v.email));
  if (exists) return { error: "Popraw zaznaczone pola.", fieldErrors: { email: "Konto z tym adresem już istnieje. Zaloguj się." } };

  const passwordHash = await hashPassword(v.password);
  const userId = await db.transaction(async (tx) => {
    const [u] = await tx.insert(users).values({ email: v.email, passwordHash, role: "partner", firstName: v.firstName, lastName: v.lastName }).returning();
    await tx.insert(partners).values({
      userId: u.id,
      status: cfg.auto_approve_partners ? "active" : "pending",
      activityType: v.activityType,
      companyName: v.activityType === "individual" ? null : v.companyName ?? null,
      nip: v.activityType === "individual" ? null : v.nip?.replace(/[\s-]/g, "") ?? null,
      termsAcceptedAt: new Date(), termsVersion: cfg.terms_version,
      marketingConsentAt: v.marketing === "on" ? new Date() : null,
    });
    return u.id;
  });
  await createSession(userId);
  redirect("/app/onboarding");
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(fd.get("email"));
  const password = String(fd.get("password") ?? "");
  const generic = { error: "Nieprawidłowy e-mail lub hasło." };
  if (!email.success || !password) return generic;
  const ip = await clientIpHash();
  if (!(await rateLimit(`login:${ip}`, 20, 900)) || !(await rateLimit(`login:${email.data}`, 8, 900))) {
    return { error: "Zbyt wiele prób logowania. Odczekaj kilkanaście minut." };
  }
  const [u] = await db.select().from(users).where(eq(users.email, email.data));
  // Zawsze wykonujemy weryfikację, aby czas odpowiedzi nie zdradzał istnienia konta.
  const ok = await verifyPassword(password, u?.passwordHash ?? "scrypt$00$00").catch(() => false);
  if (!u || !ok) return generic;
  if (u.email === DEMO_ACCOUNT.email && !env.demoMode) return generic; // konto demo działa tylko w trybie demo
  await createSession(u.id);
  const next = String(fd.get("next") ?? "");
  redirect(u.role === "admin" ? "/admin" : next.startsWith("/app") ? next : "/app");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
