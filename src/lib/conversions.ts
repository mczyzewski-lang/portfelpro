/**
 * Konwersje, naliczanie prowizji i cykl rozliczeń.
 * Status leada (klienta) i status prowizji są rozdzielone.
 * Prowizja zapisuje migawkę stawki z chwili naliczenia — zmiana stawek nie zmienia historii.
 */
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import {
  commissions, conversions, leadEvents, leads, partnerServiceTerms, payouts, services,
  type Commission, type Lead,
} from "@/db/schema";
import { logAudit, type Actor } from "./audit";
import { computeCommission, effectiveRate, triggerFor } from "./commission";
import { env } from "./env";

type LeadStatus = Lead["status"];
export class DomainError extends Error {}

async function event(tx: Tx, leadId: string, actor: Actor, type: string, from: string | null, to: string | null, note?: string | null) {
  await tx.insert(leadEvents).values({
    leadId, type, fromValue: from, toValue: to, note: note ?? null, actorUserId: actor.userId, actorLabel: actor.label,
  });
}

async function rateFor(tx: Tx, lead: Lead) {
  const [service] = await tx.select().from(services).where(eq(services.id, lead.serviceId));
  const [term] = lead.partnerId
    ? await tx.select().from(partnerServiceTerms).where(and(
        eq(partnerServiceTerms.partnerId, lead.partnerId), eq(partnerServiceTerms.serviceId, lead.serviceId)))
    : [];
  return effectiveRate(service, term, env.demoMode);
}

/** Nalicza prowizję dla konwersji, jeśli lead ma partnera i stawka na to pozwala. Idempotentne. */
async function accrue(
  tx: Tx, lead: Lead, conv: typeof conversions.$inferSelect, actor: Actor, manualAmount?: number | null,
): Promise<{ commission: Commission | null; reason?: string }> {
  if (!lead.partnerId) return { commission: null, reason: "no_partner" };
  if (conv.status !== "confirmed") return { commission: null, reason: "refunded" };
  const rate = await rateFor(tx, lead);
  const res = computeCommission(rate, { type: conv.type, netAmount: conv.netAmount, manualAmount });
  if (!res.ok) return { commission: null, reason: res.reason };
  const [c] = await tx.insert(commissions).values({
    conversionId: conv.id, leadId: lead.id, partnerId: lead.partnerId, serviceId: lead.serviceId, kind: "commission",
    model: rate.model, rateAmount: rate.amount, rateBps: rate.bps, rateSource: res.source,
    baseAmount: res.base, amount: res.amount, status: "pending",
    note: res.source === "manual" ? "Kwota wprowadzona ręcznie" : rate.demo ? "Stawka demonstracyjna" : null,
  }).onConflictDoNothing().returning();
  if (!c) return { commission: null, reason: "already_accrued" };
  await event(tx, lead.id, actor, "commission", null, "pending", `Naliczono prowizję`);
  return { commission: c };
}

export type RecordConversionInput = {
  leadId: string;
  type: "sale" | "qualified_lead";
  netAmount?: number | null;
  manualCommission?: number | null;
  externalId?: string | null;
  source: "form" | "webhook" | "csv" | "manual";
  occurredAt?: Date;
  actor: Actor;
};

export async function recordConversion(input: RecordConversionInput, outer?: Tx) {
  const run = async (tx: Tx) => {
    const [lead] = await tx.select().from(leads).where(eq(leads.id, input.leadId)).for("update");
    if (!lead) throw new DomainError("Nie znaleziono leada");
    if (input.netAmount != null && (!Number.isInteger(input.netAmount) || input.netAmount < 0)) throw new DomainError("Nieprawidłowa wartość netto");

    // Ochrona przed wielokrotnym naliczeniem: jedna konwersja danego typu na lead.
    const [conv] = await tx.insert(conversions).values({
      leadId: lead.id, type: input.type, netAmount: input.netAmount ?? null, externalId: input.externalId ?? null,
      source: input.source, occurredAt: input.occurredAt ?? new Date(), createdBy: input.actor.userId,
    }).onConflictDoNothing().returning();
    if (!conv) {
      const [existing] = await tx.select().from(conversions).where(and(eq(conversions.leadId, lead.id), eq(conversions.type, input.type)));
      return { conversion: existing, commission: null, duplicate: true as const, reason: "duplicate" };
    }
    const newStatus: LeadStatus = input.type === "sale" ? "won" : lead.status === "registered" ? "qualified" : lead.status;
    if (newStatus !== lead.status) {
      await tx.update(leads).set({ status: newStatus, updatedAt: new Date() }).where(eq(leads.id, lead.id));
      await event(tx, lead.id, input.actor, "status", lead.status, newStatus);
    }
    await event(tx, lead.id, input.actor, "conversion", null, input.type,
      input.type === "sale" ? "Potwierdzono sprzedaż" : "Potwierdzono zakwalifikowany lead");
    const { commission, reason } = await accrue(tx, lead, conv, input.actor, input.manualCommission);
    return { conversion: conv, commission, duplicate: false as const, reason };
  };
  return outer ? run(outer) : db.transaction(run);
}

/** Zmiana statusu klienta. Zakwalifikowanie leada uruchamia konwersję w modelu „za zakwalifikowany lead”. */
export async function setLeadStatus(leadId: string, status: LeadStatus, actor: Actor, note?: string | null, source: "manual" | "webhook" | "csv" = "manual") {
  return db.transaction(async (tx) => {
    const [lead] = await tx.select().from(leads).where(eq(leads.id, leadId)).for("update");
    if (!lead) throw new DomainError("Nie znaleziono leada");
    if (lead.status === status) return { changed: false };
    if (status === "won") throw new DomainError("Sprzedaż potwierdza się przez zapisanie konwersji");
    await tx.update(leads).set({ status, updatedAt: new Date() }).where(eq(leads.id, lead.id));
    await event(tx, lead.id, actor, "status", lead.status, status, note);
    if (status === "qualified") {
      const rate = await rateFor(tx, lead);
      if (triggerFor(rate.model) === "qualified_lead") {
        await recordConversion({ leadId, type: "qualified_lead", source, actor }, tx);
      }
    }
    return { changed: true };
  });
}

/** Ręczne naliczenie prowizji dla konwersji, która jej nie ma (np. stawka do ustalenia). */
export async function accrueManually(conversionId: string, amount: number | null, actor: Actor) {
  return db.transaction(async (tx) => {
    const [conv] = await tx.select().from(conversions).where(eq(conversions.id, conversionId));
    if (!conv) throw new DomainError("Nie znaleziono konwersji");
    const [lead] = await tx.select().from(leads).where(eq(leads.id, conv.leadId));
    const res = await accrue(tx, lead, conv, actor, amount);
    if (res.commission) await logAudit(tx, actor, "commission.accrue_manual", "commission", res.commission.id, { after: { amount: res.commission.amount } });
    return res;
  });
}

export async function refundConversion(conversionId: string, actor: Actor, reason: string) {
  return db.transaction(async (tx) => {
    const [conv] = await tx.select().from(conversions).where(eq(conversions.id, conversionId)).for("update");
    if (!conv) throw new DomainError("Nie znaleziono konwersji");
    if (conv.status === "refunded") return { changed: false };
    await tx.update(conversions).set({ status: "refunded" }).where(eq(conversions.id, conv.id));
    const [c] = await tx.select().from(commissions).where(and(eq(commissions.conversionId, conv.id), eq(commissions.kind, "commission")));
    if (c && (c.status === "pending" || c.status === "approved")) {
      await tx.update(commissions).set({ status: "cancelled", cancelledAt: new Date(), note: `Zwrot / anulowanie: ${reason}` }).where(eq(commissions.id, c.id));
    } else if (c && c.status === "paid") {
      // Prowizja już wypłacona — korekta ujemna, która pomniejszy kolejną wypłatę.
      await tx.insert(commissions).values({
        conversionId: conv.id, leadId: c.leadId, partnerId: c.partnerId, serviceId: c.serviceId, kind: "correction",
        model: c.model, rateAmount: c.rateAmount, rateBps: c.rateBps, rateSource: "manual", baseAmount: c.baseAmount,
        amount: -c.amount, status: "approved", approvedAt: new Date(), note: `Korekta po zwrocie: ${reason}`,
      }).onConflictDoNothing();
    }
    const [lead] = await tx.select().from(leads).where(eq(leads.id, conv.leadId));
    if (conv.type === "sale" && lead.status === "won") {
      await tx.update(leads).set({ status: "cancelled", updatedAt: new Date() }).where(eq(leads.id, lead.id));
      await event(tx, lead.id, actor, "status", lead.status, "cancelled", reason);
    }
    await event(tx, conv.leadId, actor, "refund", "confirmed", "refunded", reason);
    await logAudit(tx, actor, "conversion.refund", "conversion", conv.id, { reason });
    return { changed: true };
  });
}

export async function setCommissionStatus(id: string, to: "approved" | "cancelled" | "pending", actor: Actor, reason?: string | null) {
  return db.transaction(async (tx) => {
    const [c] = await tx.select().from(commissions).where(eq(commissions.id, id)).for("update");
    if (!c) throw new DomainError("Nie znaleziono prowizji");
    if (c.status === "paid") throw new DomainError("Wypłaconej prowizji nie można zmienić — użyj zwrotu / korekty");
    if (c.status === to) return c;
    if (to === "cancelled" && !reason?.trim()) throw new DomainError("Podaj powód anulowania");
    const now = new Date();
    await tx.update(commissions).set({
      status: to,
      approvedAt: to === "approved" ? now : null,
      cancelledAt: to === "cancelled" ? now : null,
      note: to === "cancelled" ? `Anulowano: ${reason}` : c.note,
    }).where(eq(commissions.id, id));
    await event(tx, c.leadId, actor, "commission", c.status, to, reason);
    await logAudit(tx, actor, `commission.${to}`, "commission", id, { before: { status: c.status }, after: { status: to }, reason });
    return c;
  });
}

/** Oznacza wszystkie zatwierdzone prowizje (i korekty) partnera jako wypłacone w ramach jednej wypłaty. */
export async function payPartner(partnerId: string, actor: Actor, reference: string) {
  return db.transaction(async (tx) => {
    const due = await tx.select().from(commissions)
      .where(and(eq(commissions.partnerId, partnerId), eq(commissions.status, "approved"))).for("update");
    const total = due.reduce((s, c) => s + c.amount, 0);
    if (!due.length || total <= 0) throw new DomainError("Brak dodatniej kwoty do wypłaty");
    const now = new Date();
    const [payout] = await tx.insert(payouts).values({ partnerId, amount: total, reference: reference.trim().slice(0, 200), paidAt: now, createdBy: actor.userId }).returning();
    await tx.update(commissions).set({ status: "paid", paidAt: now, payoutId: payout.id }).where(inArray(commissions.id, due.map((c) => c.id)));
    for (const c of due) await event(tx, c.leadId, actor, "commission", "approved", "paid", reference);
    await logAudit(tx, actor, "payout.create", "payout", payout.id, { after: { partnerId, amount: total, commissions: due.length, reference } });
    return payout;
  });
}

/** Ręczne przypisanie / zmiana partnera z obowiązkowym powodem i wpisem w historii. */
export async function assignLeadPartner(leadId: string, partnerId: string | null, actor: Actor, reason: string) {
  if (!reason.trim()) throw new DomainError("Podaj powód korekty przypisania");
  return db.transaction(async (tx) => {
    const [lead] = await tx.select().from(leads).where(eq(leads.id, leadId)).for("update");
    if (!lead) throw new DomainError("Nie znaleziono leada");
    if (lead.partnerId === partnerId) return { changed: false };
    const [live] = await tx.select({ n: sql<number>`count(*)::int` }).from(commissions)
      .where(and(eq(commissions.leadId, leadId), ne(commissions.status, "cancelled")));
    if (live.n > 0) throw new DomainError("Lead ma aktywne prowizje — najpierw je anuluj lub rozlicz korektą");
    await tx.update(leads).set({ partnerId, updatedAt: new Date() }).where(eq(leads.id, leadId));
    await event(tx, leadId, actor, "assignment", lead.partnerId, partnerId, reason);
    await logAudit(tx, actor, "lead.assign_partner", "lead", leadId, { before: { partnerId: lead.partnerId }, after: { partnerId }, reason });
    // Konwersje potwierdzone przed przypisaniem: prowizje anulowane dla poprzedniego partnera nie blokują (inny klucz nie istnieje),
    // dlatego nowe naliczenie wykonuje administrator świadomie w widoku leada.
    return { changed: true };
  });
}
