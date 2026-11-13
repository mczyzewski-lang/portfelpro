/**
 * Zdarzenia z zewnętrznych CRM i formularzy spółek.
 * Autoryzacja: Authorization: Bearer <WEBHOOK_SECRET>. Idempotencja: nagłówek Idempotency-Key.
 */
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { conversions, leads, services, webhookEvents } from "@/db/schema";
import { SYSTEM_ACTOR } from "./audit";
import { DomainError, recordConversion, refundConversion, setLeadStatus } from "./conversions";
import { createLead } from "./tracking";

const base = {
  service: z.string().min(1).max(120),            // slug usługi w Portfel.pro
  external_id: z.string().min(1).max(120),        // identyfikator sprawy / leada w systemie spółki
};
const contact = z.object({
  name: z.string().max(120).optional(), email: z.string().email().max(200).optional(), phone: z.string().max(40).optional(),
}).optional();

export const webhookSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("lead.created"), ...base, ref: z.string().max(60).optional(), stage: z.enum(["education", "consultation", "transaction"]).optional(), contact, consent: z.boolean().optional() }),
  z.object({ type: z.literal("lead.status"), ...base, status: z.enum(["contacted", "qualified", "in_progress", "rejected", "cancelled"]), note: z.string().max(300).optional() }),
  z.object({ type: z.literal("sale.confirmed"), ...base, ref: z.string().max(60).optional(), net_amount: z.number().nonnegative().max(100_000_000).optional(), occurred_at: z.string().datetime().optional(), contact }),
  z.object({ type: z.literal("sale.refunded"), ...base, reason: z.string().max(300).optional() }),
]);
export type WebhookEvent = z.infer<typeof webhookSchema>;

const actor = SYSTEM_ACTOR("webhook");

async function findLead(serviceId: string, externalId: string) {
  const [lead] = await db.select().from(leads).where(and(eq(leads.serviceId, serviceId), eq(leads.externalId, externalId)));
  return lead;
}

export async function processEvent(ev: WebhookEvent): Promise<Record<string, unknown>> {
  const [service] = await db.select().from(services).where(eq(services.slug, ev.service));
  if (!service) throw new DomainError(`Nieznana usługa: ${ev.service}`);

  switch (ev.type) {
    case "lead.created": {
      const { lead, duplicate } = await createLead({
        serviceId: service.id, ref: ev.ref, stage: ev.stage, source: "webhook", externalId: ev.external_id,
        contact: ev.contact, consent: ev.consent, actor,
      });
      // Lead mógł wcześniej powstać z formularza bez identyfikatora zewnętrznego — uzupełniamy go.
      if (duplicate && !lead.externalId) await db.update(leads).set({ externalId: ev.external_id }).where(eq(leads.id, lead.id));
      return { lead_number: lead.number, attributed: !!lead.partnerId, duplicate };
    }
    case "lead.status": {
      const lead = await findLead(service.id, ev.external_id);
      if (!lead) throw new DomainError("Nie znaleziono leada o podanym external_id");
      const r = await setLeadStatus(lead.id, ev.status, actor, ev.note, "webhook");
      return { lead_number: lead.number, changed: r.changed };
    }
    case "sale.confirmed": {
      let lead = await findLead(service.id, ev.external_id);
      if (!lead) {
        ({ lead } = await createLead({ serviceId: service.id, ref: ev.ref, source: "webhook", externalId: ev.external_id, contact: ev.contact, stage: "transaction", actor }));
        if (!lead.externalId) await db.update(leads).set({ externalId: ev.external_id }).where(eq(leads.id, lead.id));
      }
      const r = await recordConversion({
        leadId: lead.id, type: "sale", netAmount: ev.net_amount != null ? Math.round(ev.net_amount * 100) : null,
        externalId: ev.external_id, source: "webhook", occurredAt: ev.occurred_at ? new Date(ev.occurred_at) : undefined, actor,
      });
      return { lead_number: lead.number, duplicate: r.duplicate, commission_accrued: !!r.commission, commission_skipped_reason: r.commission ? null : r.reason ?? null };
    }
    case "sale.refunded": {
      const lead = await findLead(service.id, ev.external_id);
      if (!lead) throw new DomainError("Nie znaleziono leada o podanym external_id");
      const [conv] = await db.select().from(conversions).where(and(eq(conversions.leadId, lead.id), eq(conversions.type, "sale")));
      if (!conv) throw new DomainError("Lead nie ma potwierdzonej sprzedaży");
      const r = await refundConversion(conv.id, actor, ev.reason ?? "Zwrot zgłoszony przez integrację");
      return { lead_number: lead.number, changed: r.changed };
    }
  }
}

export async function handleWebhook(idempotencyKey: string, payload: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
  const parsed = webhookSchema.safeParse(payload);
  if (!parsed.success) return { status: 422, body: { error: "invalid_payload", details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) } };

  const [claimed] = await db.insert(webhookEvents)
    .values({ idempotencyKey, type: parsed.data.type, payload: parsed.data }).onConflictDoNothing().returning();
  if (!claimed) {
    const [prev] = await db.select().from(webhookEvents).where(eq(webhookEvents.idempotencyKey, idempotencyKey));
    if (!prev?.result) return { status: 409, body: { error: "in_progress" } };
    return { status: 200, body: { ...(prev.result as object), idempotent_replay: true } };
  }
  try {
    const result = { ok: true, ...(await processEvent(parsed.data)) };
    await db.update(webhookEvents).set({ result }).where(eq(webhookEvents.id, claimed.id));
    return { status: 200, body: result };
  } catch (e) {
    await db.delete(webhookEvents).where(eq(webhookEvents.id, claimed.id)); // pozwól ponowić po błędzie
    if (e instanceof DomainError) return { status: 422, body: { error: "unprocessable", message: e.message } };
    console.error("[webhook]", e);
    return { status: 500, body: { error: "internal_error" } };
  }
}
