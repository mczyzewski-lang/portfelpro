import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { commissions, leads, partners, services, users } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { leadRef, partnerId } from "@/lib/labels";

export const dynamic = "force-dynamic";
const zl = (g: number | null) => (g == null ? "" : (g / 100).toFixed(2).replace(".", ","));

export async function GET(_: Request, { params }: { params: Promise<{ kind: string }> }) {
  const cu = await getCurrentUser();
  if (!cu || cu.user.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { kind } = await params;
  let csv: string;
  if (kind === "leady") {
    const rows = await db.select({ l: leads, service: services.slug, pn: partners.number }).from(leads)
      .innerJoin(services, eq(services.id, leads.serviceId)).leftJoin(partners, eq(partners.id, leads.partnerId)).orderBy(desc(leads.createdAt));
    csv = toCsv(["lead", "data", "usluga", "status", "partner", "zrodlo", "etap", "external_id", "klient", "email", "telefon"],
      rows.map(({ l, service, pn }) => [leadRef(l.number), l.createdAt, service, l.status, pn ? partnerId(pn) : "", l.source, l.stage, l.externalId, l.contactName, l.contactEmail, l.contactPhone]));
  } else if (kind === "prowizje") {
    const rows = await db.select({ c: commissions, lead: leads.number, service: services.slug, pn: partners.number }).from(commissions)
      .innerJoin(leads, eq(leads.id, commissions.leadId)).innerJoin(services, eq(services.id, commissions.serviceId)).innerJoin(partners, eq(partners.id, commissions.partnerId)).orderBy(desc(commissions.createdAt));
    csv = toCsv(["data", "partner", "lead", "usluga", "rodzaj", "model", "podstawa_netto", "kwota", "status", "zatwierdzono", "wyplacono", "uwagi"],
      rows.map(({ c, lead, service, pn }) => [c.createdAt, partnerId(pn), leadRef(lead), service, c.kind, c.model, zl(c.baseAmount), zl(c.amount), c.status, c.approvedAt, c.paidAt, c.note]));
  } else if (kind === "partnerzy") {
    const rows = await db.select({ p: partners, u: users }).from(partners).innerJoin(users, eq(users.id, partners.userId)).orderBy(desc(partners.createdAt));
    csv = toCsv(["partner_id", "imie", "nazwisko", "email", "status", "forma", "firma", "nip", "branza", "dolaczyl"],
      rows.map(({ p, u }) => [partnerId(p.number), u.firstName, u.lastName, u.email, p.status, p.activityType, p.companyName, p.nip, p.professionSlug, p.createdAt]));
  } else return NextResponse.json({ error: "not_found" }, { status: 404 });

  await logAudit(db, { userId: cu.user.id, label: cu.user.email }, "export.csv", "export", kind);
  return new NextResponse(csv, { headers: {
    "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store",
    "Content-Disposition": `attachment; filename="portfelpro-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
  } });
}
