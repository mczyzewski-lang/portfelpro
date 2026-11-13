"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/client";
import { db } from "@/db";
import {
  companies, contentAssets, conversions, landingFaqs, leads, partnerServiceTerms, partners, professions,
  referralLinks, serviceProfessions, services,
} from "@/db/schema";
import { logAudit, type Actor } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { parsePLN } from "@/lib/commission";
import {
  accrueManually, assignLeadPartner, DomainError, payPartner, recordConversion, refundConversion,
  setCommissionStatus, setLeadStatus,
} from "@/lib/conversions";
import { parseCsv, slugify } from "@/lib/csv";
import { setSetting } from "@/lib/settings";
import { createLead } from "@/lib/tracking";

type Handler = (fd: FormData, actor: Actor) => Promise<string | void>;

/** Każda akcja administratora: weryfikacja roli → logika → spójna obsługa błędów → odświeżenie widoków. */
function adminAction(handler: Handler) {
  return async (_: FormState, fd: FormData): Promise<FormState> => {
    const { actor } = await requireAdmin();
    try {
      const ok = await handler(fd, actor);
      revalidatePath("/", "layout");
      return { ok: ok || "Zapisano." };
    } catch (e) {
      if (e instanceof DomainError) return { error: e.message };
      if (e instanceof z.ZodError) return { error: e.issues.map((i) => i.message).join(" ") };
      if (typeof e === "object" && e && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e; // redirect / notFound
      if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "23505") return { error: "Taki wpis już istnieje (duplikat unikalnej wartości, np. adresu/slug)." };
      console.error("[admin action]", e);
      return { error: "Nie udało się zapisać zmian." };
    }
  };
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const lines = (fd: FormData, k: string) => str(fd, k).split("\n").map((l) => l.trim()).filter(Boolean);
const money = (fd: FormData, k: string, label: string): number | null => {
  const v = parsePLN(str(fd, k));
  if (Number.isNaN(v)) throw new DomainError(`${label}: podaj kwotę w formacie 1234,50`);
  return v;
};
const percentBps = (fd: FormData, k: string): number | null => {
  const raw = str(fd, k).replace("%", "").replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new DomainError("Procent musi być liczbą z zakresu 0–100");
  return Math.round(n * 100);
};
const modelEnum = z.enum(["fixed", "percent", "qualified_lead", "custom"]);

function rateFields(fd: FormData, prefix = "") {
  const model = modelEnum.parse(str(fd, `${prefix}model`));
  const amount = money(fd, `${prefix}amount`, "Kwota prowizji");
  const bps = percentBps(fd, `${prefix}percent`);
  if ((model === "fixed" || model === "qualified_lead") && amount == null) return { model, amount: null, bps: null, complete: false };
  if (model === "percent" && bps == null) return { model, amount: null, bps: null, complete: false };
  return { model, amount: model === "percent" || model === "custom" ? null : amount, bps: model === "percent" ? bps : null, complete: model !== "custom" };
}

/* ================= partnerzy ================= */
export const setPartnerStatusAction = adminAction(async (fd, actor) => {
  const id = str(fd, "partnerId");
  const status = z.enum(["pending", "active", "suspended"]).parse(str(fd, "status"));
  const [p] = await db.select().from(partners).where(eq(partners.id, id));
  if (!p) throw new DomainError("Nie znaleziono partnera");
  if (p.status === status) return "Status bez zmian.";
  await db.update(partners).set({ status }).where(eq(partners.id, id));
  await logAudit(db, actor, "partner.status", "partner", id, { before: { status: p.status }, after: { status }, reason: str(fd, "reason") || null });
  return status === "active" ? "Konto partnera jest aktywne." : "Zmieniono status konta.";
});

export const setPartnerNoteAction = adminAction(async (fd) => {
  await db.update(partners).set({ adminNote: str(fd, "note").slice(0, 2000) }).where(eq(partners.id, str(fd, "partnerId")));
});

/** Dostęp do usługi wymagającej zatwierdzenia oraz indywidualna stawka partnera. */
export const setPartnerTermAction = adminAction(async (fd, actor) => {
  const partnerId = str(fd, "partnerId"), serviceId = str(fd, "serviceId");
  const access = z.enum(["", "requested", "approved", "rejected"]).parse(str(fd, "access"));
  const useCustom = str(fd, "useCustom") === "on";
  const rate = useCustom ? rateFields(fd) : null;
  if (rate && !rate.complete) throw new DomainError("Uzupełnij kwotę lub procent indywidualnej stawki");
  const [before] = await db.select().from(partnerServiceTerms).where(and(eq(partnerServiceTerms.partnerId, partnerId), eq(partnerServiceTerms.serviceId, serviceId)));
  const values = {
    accessStatus: access === "" ? null : access,
    customModel: rate?.model ?? null, customAmount: rate?.amount ?? null, customBps: rate?.bps ?? null,
    note: str(fd, "note").slice(0, 500), updatedAt: new Date(),
  };
  await db.insert(partnerServiceTerms).values({ partnerId, serviceId, ...values })
    .onConflictDoUpdate({ target: [partnerServiceTerms.partnerId, partnerServiceTerms.serviceId], set: values });
  await logAudit(db, actor, "partner.service_terms", "partner", partnerId, { before: before ?? null, after: { serviceId, ...values } });
  return "Zapisano warunki. Dotyczą tylko przyszłych naliczeń — historia prowizji pozostaje bez zmian.";
});

/* ================= spółki ================= */
export const saveCompanyAction = adminAction(async (fd, actor) => {
  const id = str(fd, "id");
  const data = z.object({
    name: z.string().min(2, "Podaj nazwę spółki").max(120), tagline: z.string().max(200), description: z.string().max(2000),
    logoUrl: z.string().max(500), iconUrl: z.string().max(500), color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Kolor w formacie #RRGGBB"),
  }).parse({ name: str(fd, "name"), tagline: str(fd, "tagline"), description: str(fd, "description"), logoUrl: str(fd, "logoUrl"), iconUrl: str(fd, "iconUrl"), color: str(fd, "color") || "#713B20" });
  for (const u of [data.logoUrl, data.iconUrl]) {
    if (u && !/^(https:\/\/|\/(?!\/))/.test(u)) throw new DomainError("Logo / ikona: podaj adres https:// lub ścieżkę zaczynającą się od /");
  }
  const values = { ...data, logoUrl: data.logoUrl || null, iconUrl: data.iconUrl || null, published: str(fd, "published") === "on", sort: Number(str(fd, "sort")) || 0 };
  if (id) await db.update(companies).set(values).where(eq(companies.id, id));
  else await db.insert(companies).values({ ...values, slug: slugify(data.name) });
  await logAudit(db, actor, id ? "company.update" : "company.create", "company", id || null, { after: values });
});

/* ================= usługi ================= */
export const createServiceAction = adminAction(async (fd, actor) => {
  const name = z.string().min(3, "Podaj nazwę usługi").max(160).parse(str(fd, "name"));
  const [s] = await db.insert(services).values({ companyId: str(fd, "companyId"), name, slug: slugify(name), status: "draft" }).returning();
  await logAudit(db, actor, "service.create", "service", s.id, { after: { name } });
  redirect(`/admin/uslugi/${s.id}`);
});

export const saveServiceAction = adminAction(async (fd, actor) => {
  const id = str(fd, "id");
  const [before] = await db.select().from(services).where(eq(services.id, id));
  if (!before) throw new DomainError("Nie znaleziono usługi");
  const rate = rateFields(fd);
  const rateStatus = z.enum(["tbd", "demo", "approved"]).parse(str(fd, "rateStatus"));
  if (rateStatus !== "tbd" && rate.model !== "custom" && !rate.complete) throw new DomainError("Uzupełnij kwotę lub procent prowizji albo ustaw status stawki „Do ustalenia”");
  const faq = lines(fd, "faq").map((l) => { const [q, ...a] = l.split("|"); return { q: q.trim(), a: a.join("|").trim() }; }).filter((f) => f.q && f.a);
  const values = {
    name: z.string().min(3).max(160).parse(str(fd, "name")),
    slug: z.string().regex(/^[a-z0-9-]{3,80}$/, "Adres (slug): małe litery, cyfry i myślniki").parse(str(fd, "slug")),
    companyId: str(fd, "companyId"), category: str(fd, "category") || "Inne",
    status: z.enum(["draft", "published", "hidden"]).parse(str(fd, "status")),
    access: z.enum(["open", "approval_required"]).parse(str(fd, "access")),
    sensitive: str(fd, "sensitive") === "on", sort: Number(str(fd, "sort")) || 0,
    clientBenefit: str(fd, "clientBenefit"), audienceShort: str(fd, "audienceShort"), description: str(fd, "description"),
    problems: lines(fd, "problems"), audience: lines(fd, "audience"), whenToRecommend: lines(fd, "whenToRecommend"),
    signals: lines(fd, "signals"), arguments: lines(fd, "arguments"), pitch: str(fd, "pitch"), faq,
    doNotPromise: lines(fd, "doNotPromise"), provider: str(fd, "provider"), commissionTerms: str(fd, "commissionTerms"),
    commissionModel: rate.model, commissionAmount: rate.amount, commissionBps: rate.bps,
    commissionCondition: str(fd, "commissionCondition"), commissionNote: str(fd, "commissionNote"), rateStatus,
    updatedAt: new Date(),
  };
  if (values.status === "published" && (!values.clientBenefit || !values.description)) throw new DomainError("Przed publikacją uzupełnij krótki opis i opis usługi");
  await db.transaction(async (tx) => {
    await tx.update(services).set(values).where(eq(services.id, id));
    await tx.delete(serviceProfessions).where(eq(serviceProfessions.serviceId, id));
    const profs = fd.getAll("professions").map(String);
    if (profs.length) await tx.insert(serviceProfessions).values(profs.map((slug) => ({ serviceId: id, professionSlug: slug, reason: str(fd, `reason_${slug}`) })));
    const pick = (s: typeof before) => ({ model: s.commissionModel, amount: s.commissionAmount, bps: s.commissionBps, rateStatus: s.rateStatus, status: s.status, access: s.access });
    await logAudit(tx, actor, "service.update", "service", id, { before: pick(before), after: pick({ ...before, ...values }) });
  });
  return "Zapisano usługę. Zmiana stawki nie wpływa na prowizje już naliczone.";
});

/* ================= materiały ================= */
export const saveAssetAction = adminAction(async (fd, actor) => {
  const id = str(fd, "id");
  const title = z.string().min(3, "Podaj tytuł materiału").max(200).parse(str(fd, "title"));
  const targetUrl = str(fd, "targetUrl");
  if (targetUrl && !/^https:\/\/[^\s]+$/.test(targetUrl)) throw new DomainError("URL docelowy musi zaczynać się od https:// (puste pole = wewnętrzna strona demo)");
  const values = {
    title, stage: z.enum(["education", "consultation", "transaction"]).parse(str(fd, "stage")),
    type: z.enum(["article", "guide", "webinar", "video", "quiz", "calculator", "landing", "form", "booking"]).parse(str(fd, "type")),
    description: str(fd, "description"), body: str(fd, "body"), targetUrl: targetUrl || null, shareText: str(fd, "shareText"),
    status: z.enum(["draft", "published", "hidden"]).parse(str(fd, "status")), sort: Number(str(fd, "sort")) || 0,
  };
  if (id) {
    const [a] = await db.select().from(contentAssets).where(eq(contentAssets.id, id));
    if (!a) throw new DomainError("Nie znaleziono materiału");
    // Etap materiału z istniejącymi linkami pozostaje spójny z linkami partnerów.
    await db.update(contentAssets).set(values).where(eq(contentAssets.id, id));
    await db.update(referralLinks).set({ stage: values.stage }).where(eq(referralLinks.assetId, id));
  } else {
    const serviceId = str(fd, "serviceId");
    const base = slugify(title) || "material";
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(contentAssets).where(and(eq(contentAssets.serviceId, serviceId), sql`${contentAssets.slug} like ${base + "%"}`));
    await db.insert(contentAssets).values({ ...values, serviceId, slug: n ? `${base}-${n + 1}` : base });
  }
  await logAudit(db, actor, id ? "asset.update" : "asset.create", "asset", id || null, { after: { title, stage: values.stage, status: values.status, targetUrl: values.targetUrl } });
});

/* ================= leady i konwersje ================= */
async function partnerByNumber(raw: string) {
  const n = Number(raw.replace(/\D/g, ""));
  if (!n) return null;
  const [p] = await db.select().from(partners).where(eq(partners.number, n));
  if (!p) throw new DomainError(`Nie znaleziono partnera ${raw}`);
  return p;
}

export const createManualLeadAction = adminAction(async (fd, actor) => {
  const partner = await partnerByNumber(str(fd, "partnerNumber"));
  const email = str(fd, "email");
  if (email && !z.string().email().safeParse(email).success) throw new DomainError("Nieprawidłowy e-mail klienta");
  const { lead, duplicate } = await createLead({
    serviceId: str(fd, "serviceId"), source: "manual", partnerId: partner?.id ?? null, externalId: str(fd, "externalId") || null,
    contact: { name: str(fd, "name"), email, phone: str(fd, "phone") }, actor,
  });
  if (duplicate) throw new DomainError(`Taki klient jest już zarejestrowany dla tej usługi (L-${lead.number}).`);
  await logAudit(db, actor, "lead.create_manual", "lead", lead.id, { after: { partnerId: partner?.id ?? null }, reason: str(fd, "reason") || null });
  redirect(`/admin/polecenia/${lead.id}`);
});

export const setLeadStatusAction = adminAction(async (fd, actor) => {
  const status = z.enum(["registered", "qualified", "in_progress", "rejected", "cancelled"]).parse(str(fd, "status"));
  const r = await setLeadStatus(str(fd, "leadId"), status, actor, str(fd, "note") || null);
  return r.changed ? "Zmieniono status." : "Status bez zmian.";
});

export const confirmSaleAction = adminAction(async (fd, actor) => {
  const r = await recordConversion({
    leadId: str(fd, "leadId"), type: "sale", netAmount: money(fd, "netAmount", "Wartość netto"),
    manualCommission: money(fd, "manualCommission", "Prowizja ręczna"), source: "manual", actor,
  });
  if (r.duplicate) throw new DomainError("Sprzedaż dla tego leada została już potwierdzona — nie naliczamy drugi raz.");
  if (r.commission) return "Sprzedaż potwierdzona, prowizja naliczona.";
  const why: Record<string, string> = {
    no_partner: "lead nie ma przypisanego partnera", no_rate: "stawka nie jest ustalona — nalicz prowizję ręcznie",
    missing_net_amount: "model procentowy wymaga wartości netto — nalicz prowizję ręcznie", wrong_trigger: "ta usługa rozlicza się za zakwalifikowany lead",
  };
  return `Sprzedaż potwierdzona. Prowizja nie została naliczona: ${why[r.reason ?? ""] ?? r.reason}.`;
});

export const accrueManualAction = adminAction(async (fd, actor) => {
  const amount = money(fd, "amount", "Kwota prowizji");
  const r = await accrueManually(str(fd, "conversionId"), amount, actor);
  if (!r.commission) throw new DomainError(r.reason === "no_partner" ? "Najpierw przypisz partnera do leada." : r.reason === "already_accrued" ? "Prowizja dla tej konwersji już istnieje." : "Podaj kwotę prowizji — stawka nie pozwala naliczyć jej automatycznie.");
  return "Prowizja naliczona.";
});

export const refundAction = adminAction(async (fd, actor) => {
  const reason = z.string().min(3, "Podaj powód zwrotu / anulowania").parse(str(fd, "reason"));
  await refundConversion(str(fd, "conversionId"), actor, reason);
  return "Zapisano zwrot. Prowizja została anulowana lub skorygowana.";
});

export const assignPartnerAction = adminAction(async (fd, actor) => {
  const raw = str(fd, "partnerNumber");
  const partner = raw ? await partnerByNumber(raw) : null;
  const r = await assignLeadPartner(str(fd, "leadId"), partner?.id ?? null, actor, str(fd, "reason"));
  return r.changed ? "Zmieniono przypisanie partnera." : "Przypisanie bez zmian.";
});

/* ================= prowizje i wypłaty ================= */
export const commissionStatusAction = adminAction(async (fd, actor) => {
  const to = z.enum(["approved", "cancelled", "pending"]).parse(str(fd, "to"));
  await setCommissionStatus(str(fd, "commissionId"), to, actor, str(fd, "reason") || null);
  return to === "approved" ? "Prowizja zatwierdzona do wypłaty." : to === "cancelled" ? "Prowizja anulowana." : "Cofnięto zatwierdzenie.";
});

export const payPartnerAction = adminAction(async (fd, actor) => {
  const p = await payPartner(str(fd, "partnerId"), actor, str(fd, "reference"));
  return `Oznaczono wypłatę ${(p.amount / 100).toFixed(2).replace(".", ",")} zł.`;
});

/* ================= ustawienia i treści ================= */
export const saveSettingsAction = adminAction(async (fd, actor) => {
  const days = z.coerce.number().int().min(1, "Okno atrybucji: 1–365 dni").max(365).parse(str(fd, "attribution_window_days"));
  await setSetting("attribution_window_days", days);
  await setSetting("auto_approve_partners", str(fd, "auto_approve_partners") === "on");
  await setSetting("terms_version", str(fd, "terms_version") || "v1");
  await logAudit(db, actor, "settings.update", "settings", null, { after: { attribution_window_days: days, auto_approve_partners: str(fd, "auto_approve_partners") === "on" } });
  return "Zapisano. Nowe okno atrybucji dotyczy kolejnych kliknięć.";
});

export const saveFaqAction = adminAction(async (fd) => {
  const id = str(fd, "id");
  if (str(fd, "delete") === "1" && id) { await db.delete(landingFaqs).where(eq(landingFaqs.id, id)); return "Usunięto pytanie."; }
  const values = {
    question: z.string().min(5, "Podaj pytanie").parse(str(fd, "question")), answer: z.string().min(5, "Podaj odpowiedź").parse(str(fd, "answer")),
    sort: Number(str(fd, "sort")) || 0, published: str(fd, "published") === "on",
  };
  if (id) await db.update(landingFaqs).set(values).where(eq(landingFaqs.id, id));
  else await db.insert(landingFaqs).values(values);
});

export const saveProfessionAction = adminAction(async (fd) => {
  const slug = str(fd, "slug");
  const values = { name: z.string().min(2, "Podaj nazwę grupy").parse(str(fd, "name")), label: z.string().min(2, "Podaj etykietę").parse(str(fd, "label")), sort: Number(str(fd, "sort")) || 0 };
  if (slug) await db.update(professions).set(values).where(eq(professions.slug, slug));
  else await db.insert(professions).values({ ...values, slug: slugify(values.name) });
});

/* ================= import CSV ================= */
export const importCsvAction = adminAction(async (fd, actor) => {
  const file = fd.get("file");
  const text = file instanceof File && file.size > 0 ? await file.text() : str(fd, "csv");
  if (!text) throw new DomainError("Wybierz plik CSV lub wklej dane.");
  if (text.length > 2_000_000) throw new DomainError("Plik jest zbyt duży (limit 2 MB).");
  const rows = parseCsv(text);
  if (!rows.length) throw new DomainError("Nie znaleziono wierszy z danymi.");
  const svc = new Map((await db.select().from(services)).map((s) => [s.slug, s]));
  let created = 0, sales = 0, statuses = 0; const errors: string[] = [];
  for (const [i, r] of rows.entries()) {
    const line = i + 2;
    try {
      const service = svc.get(r.service);
      if (!service) throw new DomainError(`nieznana usługa „${r.service}”`);
      if (!r.external_id) throw new DomainError("brak external_id");
      let [lead] = await db.select().from(leads).where(and(eq(leads.serviceId, service.id), eq(leads.externalId, r.external_id)));
      if (!lead) {
        const partner = r.partner_id ? await partnerByNumber(r.partner_id) : null;
        const res = await createLead({
          serviceId: service.id, source: "csv", externalId: r.external_id, partnerId: partner?.id ?? null, ref: r.ref || null,
          contact: { name: r.name, email: r.email, phone: r.phone }, actor,
        });
        lead = res.lead;
        if (!res.duplicate) created++;
        else if (!lead.externalId) await db.update(leads).set({ externalId: r.external_id }).where(eq(leads.id, lead.id));
      }
      const type = (r.type || "lead").toLowerCase();
      if (type === "sale") {
        const net = parsePLN(r.net_amount);
        if (Number.isNaN(net)) throw new DomainError("nieprawidłowa kwota net_amount");
        const res = await recordConversion({ leadId: lead.id, type: "sale", netAmount: net, externalId: r.external_id, source: "csv", actor });
        if (!res.duplicate) sales++;
      } else if (r.status && r.status !== lead.status) {
        const st = z.enum(["registered", "qualified", "in_progress", "rejected", "cancelled"]).safeParse(r.status);
        if (!st.success) throw new DomainError(`nieznany status „${r.status}”`);
        await setLeadStatus(lead.id, st.data, actor, "Import CSV", "csv"); statuses++;
      }
    } catch (e) {
      errors.push(`wiersz ${line}: ${e instanceof Error ? e.message : "błąd"}`);
    }
  }
  await logAudit(db, actor, "import.csv", "import", null, { after: { rows: rows.length, created, sales, statuses, errors: errors.length } });
  const summary = `Przetworzono ${rows.length} wierszy: nowe leady ${created}, sprzedaże ${sales}, zmiany statusu ${statuses}.`;
  if (errors.length) throw new DomainError(`${summary} Błędy (${errors.length}): ${errors.slice(0, 8).join("; ")}`);
  return summary;
});

/* pomocnicze — używane w widoku leada */
export async function getLeadConversions(leadId: string) {
  await requireAdmin();
  return db.select().from(conversions).where(eq(conversions.leadId, leadId));
}
