import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { partners } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Zdjęcie partnera — publiczne wyłącznie wtedy, gdy sam włączył Portfel Publiczny. */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[A-Za-z0-9]{6,16}$/.test(slug)) return new NextResponse(null, { status: 404 });
  const [p] = await db.select({ avatar: partners.avatar }).from(partners)
    .where(and(eq(partners.publicSlug, slug), eq(partners.publicEnabled, true), eq(partners.status, "active")));
  const m = p?.avatar ? /^data:image\/jpeg;base64,(.+)$/.exec(p.avatar) : null;
  if (!m) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(m[1], "base64"), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
