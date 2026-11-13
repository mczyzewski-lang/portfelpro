import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Zdjęcie zalogowanego partnera. Prywatne — każdy widzi wyłącznie własne. */
export async function GET() {
  const cu = await getCurrentUser();
  const m = cu?.partner?.avatar ? /^data:image\/jpeg;base64,(.+)$/.exec(cu.partner.avatar) : null;
  if (!m) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(m[1], "base64"), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
