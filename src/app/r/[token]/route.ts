import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { ipFromHeaders } from "@/lib/rate-limit";
import { handleClick, VISITOR_COOKIE } from "@/lib/tracking";

export const dynamic = "force-dynamic";

/** Link polecający: zapisuje kliknięcie i atrybucję, po czym przekierowuje na stronę docelową z tokenem ?pp_ref=. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let result: Awaited<ReturnType<typeof handleClick>>;
  try {
    result = await handleClick(token, {
      visitorId: req.cookies.get(VISITOR_COOKIE)?.value ?? null,
      userAgent: req.headers.get("user-agent"),
      ip: ipFromHeaders(req.headers),
      referer: req.headers.get("referer"),
    });
  } catch (e) {
    console.error("[r] błąd obsługi kliknięcia", e);
    result = { ok: false };
  }
  if (!result.ok) return NextResponse.redirect(`${env.appUrl}/link-nieaktywny`, 302);

  const res = NextResponse.redirect(result.redirectTo, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (result.visitorId && result.setCookieDays) {
    // Cookie pierwszej strony, niedostępne dla JS. Służy wyłącznie do przypisania polecenia w oknie atrybucji.
    res.cookies.set(VISITOR_COOKIE, result.visitorId, {
      httpOnly: true, secure: env.isProd, sameSite: "lax", path: "/", maxAge: result.setCookieDays * 86400,
    });
  }
  return res;
}
