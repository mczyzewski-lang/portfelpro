import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { partners, sessions, users, type Partner, type User } from "@/db/schema";
import { randomSecret, sha256 } from "./crypto";
import { DEMO_ACCOUNT } from "./demo";
import { env } from "./env";
import type { Actor } from "./audit";

const COOKIE = "pp_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const token = randomSecret();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(sessions).values({ tokenHash: sha256(token), userId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: env.isProd, sameSite: "lax", path: "/", expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  jar.delete(COOKIE);
}

export type CurrentUser = { user: User; partner: Partner | null };

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ user: users, partner: partners })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(partners, eq(partners.userId, users.id))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())));
  if (row && row.user.email === DEMO_ACCOUNT.email && !env.demoMode) return null;
  return row ?? null;
});

/** Wymaga zalogowanego partnera. Każda strona i akcja panelu partnera zaczyna się od tego wywołania. */
export async function requirePartner(): Promise<{ user: User; partner: Partner }> {
  const cu = await getCurrentUser();
  if (!cu) redirect("/logowanie");
  if (cu.user.role === "admin") redirect("/admin");
  if (!cu.partner) redirect("/logowanie");
  return { user: cu.user, partner: cu.partner };
}

/** Wymaga administratora. Każda strona i akcja /admin zaczyna się od tego wywołania. */
export async function requireAdmin(): Promise<{ user: User; actor: Actor }> {
  const cu = await getCurrentUser();
  if (!cu) redirect("/logowanie?next=/admin");
  if (cu.user.role !== "admin") redirect("/app");
  return { user: cu.user, actor: { userId: cu.user.id, label: cu.user.email } };
}
