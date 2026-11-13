import { NextResponse, type NextRequest } from "next/server";
import { hmac, safeEqual } from "@/lib/crypto";
import { env } from "@/lib/env";
import { ipFromHeaders, rateLimit } from "@/lib/rate-limit";
import { handleWebhook } from "@/lib/webhook";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ipKey = hmac(`ip:${ipFromHeaders(req.headers)}`).slice(0, 32);
  if (!env.webhookSecret || env.webhookSecret.startsWith("change-me")) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !safeEqual(token, env.webhookSecret)) {
    if (!(await rateLimit(`webhook-auth:${ipKey}`, 20, 600))) return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!(await rateLimit(`webhook:${ipKey}`, 600, 60))) return NextResponse.json({ error: "too_many_requests" }, { status: 429 });

  const key = req.headers.get("idempotency-key")?.trim() ?? "";
  if (!/^[\w.:-]{8,120}$/.test(key)) return NextResponse.json({ error: "missing_idempotency_key", message: "Wymagany nagłówek Idempotency-Key (8–120 znaków)." }, { status: 400 });

  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const { status, body } = await handleWebhook(key, payload);
  return NextResponse.json(body, { status });
}
