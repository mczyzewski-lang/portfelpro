import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Zdjęcie opiekuna — dostępne tylko dla zalogowanych i tylko dla kont opiekunów (administratorów). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const cu = await getCurrentUser();
  const { id } = await params;
  if (!cu || !/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const [u] = await db.select({ avatar: users.avatar }).from(users).where(and(eq(users.id, id), eq(users.role, "admin")));
  const m = u?.avatar ? /^data:image\/jpeg;base64,(.+)$/.exec(u.avatar) : null;
  if (!m) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(m[1], "base64"), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
