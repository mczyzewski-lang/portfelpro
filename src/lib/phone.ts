import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { db } from "@/db";
import { phoneCodes } from "@/db/schema";
import { hmac } from "./crypto";
import { env } from "./env";

/** Polski numer komórkowy → +48XXXXXXXXX; null, gdy numer jest nieprawidłowy. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+48")) d = d.slice(3); else if (d.startsWith("0048")) d = d.slice(4); else if (d.startsWith("48") && d.length === 11) d = d.slice(2);
  return /^[4-8]\d{8}$/.test(d) ? `+48${d}` : null;
}
export const formatPhone = (p: string) => p.replace(/^\+48(\d{3})(\d{3})(\d{3})$/, "+48 $1 $2 $3");
/** Konta zakładane telefonem mają techniczny adres e-mail — nie pokazujemy go użytkownikowi. */
export const PHONE_EMAIL_DOMAIN = "@tel.portfel.pro";
export const isPhoneEmail = (email: string) => email.endsWith(PHONE_EMAIL_DOMAIN);

/** Kontakt pokazywany w panelach: numer telefonu dla kont zakładanych telefonem, inaczej e-mail. */
export const contactOf = (u: { email: string; loginPhone: string | null }) => (u.loginPhone ? formatPhone(u.loginPhone) : u.email);

const codeHash = (phone: string, code: string) => hmac(`sms:${phone}:${code}`);

/** Wysyłka SMS przez SMSAPI.pl (token OAuth w SMSAPI_TOKEN, opcjonalne pole nadawcy w SMSAPI_SENDER). */
export async function sendSms(phone: string, message: string): Promise<boolean> {
  const body = new URLSearchParams({ to: phone.replace(/^\+/, ""), message, format: "json", encoding: "utf-8" });
  if (process.env.SMSAPI_SENDER) body.set("from", process.env.SMSAPI_SENDER);
  try {
    const res = await fetch("https://api.smsapi.pl/sms.do", { method: "POST", headers: { Authorization: `Bearer ${process.env.SMSAPI_TOKEN}` }, body, signal: AbortSignal.timeout(10_000) });
    const json = (await res.json().catch(() => null)) as { error?: number; message?: string } | null;
    if (res.ok && json && !json.error) return true;
    console.error("[smsapi]", res.status, json?.error, json?.message);
  } catch (e) { console.error("[smsapi]", e instanceof Error ? e.message : e); }
  return false;
}

/**
 * Wysyła kod logowania. Z ustawionym SMSAPI_TOKEN kod idzie SMS-em. Bez tokenu: w trybie demo kod jest
 * pokazywany na ekranie, poza trybem demo funkcja zgłasza brak konfiguracji (nie udajemy wysyłki).
 */
export async function issueCode(phone: string): Promise<{ ok: true; demoCode: string | null } | { ok: false; error: string }> {
  const sms = !!process.env.SMSAPI_TOKEN;
  if (!sms && !env.demoMode) return { ok: false, error: "Logowanie SMS nie jest jeszcze skonfigurowane. Załóż konto e-mailem." };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const [row] = await db.insert(phoneCodes).values({ phone, codeHash: codeHash(phone, code), expiresAt: new Date(Date.now() + 10 * 60_000) }).returning({ id: phoneCodes.id });
  if (!sms) return { ok: true, demoCode: code };
  if (await sendSms(phone, `Portfel.pro: Twój kod to ${code}. Ważny 10 minut.`)) return { ok: true, demoCode: null };
  await db.delete(phoneCodes).where(eq(phoneCodes.id, row.id));
  return { ok: false, error: "Nie udało się wysłać SMS-a. Spróbuj ponownie za chwilę." };
}

/** Sprawdza kod (maks. 5 prób na kod). `consume` zużywa go — przy ostatnim kroku rejestracji lub logowaniu. */
export async function checkCode(phone: string, code: string, consume: boolean): Promise<boolean> {
  const [row] = await db.select().from(phoneCodes)
    .where(and(eq(phoneCodes.phone, phone), isNull(phoneCodes.consumedAt), gt(phoneCodes.expiresAt, new Date()))).orderBy(desc(phoneCodes.createdAt)).limit(1);
  if (!row || row.attempts >= 5) return false;
  if (row.codeHash !== codeHash(phone, code.replace(/\D/g, ""))) {
    await db.update(phoneCodes).set({ attempts: sql`${phoneCodes.attempts} + 1` }).where(eq(phoneCodes.id, row.id));
    return false;
  }
  if (consume) await db.update(phoneCodes).set({ consumedAt: new Date() }).where(eq(phoneCodes.id, row.id));
  return true;
}
