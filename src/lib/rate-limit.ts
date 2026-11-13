import { lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { hmac } from "./crypto";

/** Prosty limiter „fixed window” w bazie — działa także na wielu instancjach / serverless. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({ target: [rateLimits.key, rateLimits.windowStart], set: { count: sql`${rateLimits.count} + 1` } })
    .returning({ count: rateLimits.count });
  if (Math.random() < 0.02) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(Date.now() - 24 * 3600 * 1000)));
  }
  return row.count <= limit;
}

export function ipFromHeaders(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
export async function clientIpHash(): Promise<string> {
  return hmac(`ip:${ipFromHeaders(await headers())}`).slice(0, 32);
}
