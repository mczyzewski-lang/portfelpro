import { relations, sql } from "drizzle-orm";
import {
  bigint, boolean, index, integer, jsonb, pgEnum, pgSequence, pgTable, primaryKey, text,
  timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const ts = (name: string) => timestamp(name, { withTimezone: true });

/* ---------- enums ---------- */
export const userRole = pgEnum("user_role", ["partner", "admin"]);
export const partnerStatus = pgEnum("partner_status", ["pending", "active", "suspended"]);
export const activityType = pgEnum("activity_type", ["individual", "sole_trader", "company"]);
export const publishStatus = pgEnum("publish_status", ["draft", "published", "hidden"]);
export const serviceAccess = pgEnum("service_access", ["open", "approval_required"]);
export const accessStatus = pgEnum("access_status", ["requested", "approved", "rejected"]);
export const commissionModel = pgEnum("commission_model", ["fixed", "percent", "qualified_lead", "custom"]);
export const rateStatus = pgEnum("rate_status", ["tbd", "demo", "approved"]);
export const funnelStage = pgEnum("funnel_stage", ["education", "consultation", "transaction"]);
export const assetType = pgEnum("asset_type", [
  "article", "guide", "webinar", "video", "quiz", "calculator", "landing", "form", "booking",
]);
export const leadStatus = pgEnum("lead_status", [
  "registered", "qualified", "in_progress", "won", "rejected", "cancelled",
]);
export const leadSource = pgEnum("lead_source", ["form", "webhook", "csv", "manual"]);
export const conversionType = pgEnum("conversion_type", ["sale", "qualified_lead"]);
export const conversionStatus = pgEnum("conversion_status", ["confirmed", "refunded"]);
export const commissionStatus = pgEnum("commission_status", ["pending", "approved", "paid", "cancelled"]);

export const partnerNumberSeq = pgSequence("partner_number_seq", { startWith: 101 });
export const leadNumberSeq = pgSequence("lead_number_seq", { startWith: 1001 });

/* ---------- users & auth ---------- */
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("partner"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: createdAt(),
});

export const sessions = pgTable("sessions", {
  id: id(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
});

export const professions = pgTable("professions", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),          // "Biura rachunkowe i księgowi"
  label: text("label").notNull(),        // "Jestem księgowym"
  icon: text("icon").notNull().default("briefcase"),
  sort: integer("sort").notNull().default(0),
});

export const partners = pgTable("partners", {
  id: id(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  number: bigint("number", { mode: "number" }).notNull().unique().default(sql`nextval('partner_number_seq')`),
  status: partnerStatus("status").notNull().default("pending"),
  activityType: activityType("activity_type").notNull(),
  companyName: text("company_name"),
  nip: text("nip"),
  professionSlug: text("profession_slug").references(() => professions.slug, { onDelete: "set null" }),
  onboardedAt: ts("onboarded_at"),
  firstSuccessSeenAt: ts("first_success_seen_at"),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }).notNull(),
  termsVersion: text("terms_version").notNull(),
  marketingConsentAt: ts("marketing_consent_at"),
  adminNote: text("admin_note"),
  createdAt: createdAt(),
});

/* ---------- catalog ---------- */
export const companies = pgTable("companies", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  logoUrl: text("logo_url"),
  color: text("color").notNull().default("#713B20"),
  published: boolean("published").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: createdAt(),
});

export type Qa = { q: string; a: string };

export const services = pgTable("services", {
  id: id(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Inne"),
  status: publishStatus("status").notNull().default("draft"),
  access: serviceAccess("access").notNull().default("open"),
  sensitive: boolean("sensitive").notNull().default(false), // zdrowie / sprawy rodzinne — dodatkowa minimalizacja danych
  sort: integer("sort").notNull().default(0),
  // treści
  clientBenefit: text("client_benefit").notNull().default(""),   // krótki opis sprzedażowy
  audienceShort: text("audience_short").notNull().default(""),   // "dla kogo" — jedna linia
  description: text("description").notNull().default(""),        // czym jest usługa
  problems: jsonb("problems").$type<string[]>().notNull().default([]),
  audience: jsonb("audience").$type<string[]>().notNull().default([]),
  whenToRecommend: jsonb("when_to_recommend").$type<string[]>().notNull().default([]),
  signals: jsonb("signals").$type<string[]>().notNull().default([]),
  arguments: jsonb("arguments").$type<string[]>().notNull().default([]),
  pitch: text("pitch").notNull().default(""),                    // 15–30 sekund
  faq: jsonb("faq").$type<Qa[]>().notNull().default([]),
  doNotPromise: jsonb("do_not_promise").$type<string[]>().notNull().default([]),
  provider: text("provider").notNull().default(""),
  commissionTerms: text("commission_terms").notNull().default(""),
  // prowizja
  commissionModel: commissionModel("commission_model").notNull().default("custom"),
  commissionAmount: integer("commission_amount"),   // grosze (fixed / qualified_lead)
  commissionBps: integer("commission_bps"),         // punkty bazowe (percent), 1000 = 10%
  commissionCondition: text("commission_condition").notNull().default(""),
  commissionNote: text("commission_note").notNull().default(""), // opis modelu niestandardowego
  rateStatus: rateStatus("rate_status").notNull().default("tbd"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceProfessions = pgTable("service_professions", {
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  professionSlug: text("profession_slug").notNull().references(() => professions.slug, { onDelete: "cascade" }),
  reason: text("reason").notNull().default(""),
}, (t) => [primaryKey({ columns: [t.serviceId, t.professionSlug] })]);

export const partnerServiceTerms = pgTable("partner_service_terms", {
  id: id(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  accessStatus: accessStatus("access_status"),             // dla usług wymagających zatwierdzenia
  customModel: commissionModel("custom_model"),            // indywidualna stawka (null = standardowa)
  customAmount: integer("custom_amount"),
  customBps: integer("custom_bps"),
  note: text("note").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("pst_partner_service").on(t.partnerId, t.serviceId)]);

export const contentAssets = pgTable("content_assets", {
  id: id(),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  stage: funnelStage("stage").notNull(),
  type: assetType("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  body: text("body").notNull().default(""),            // treść wewnętrznej strony demo
  targetUrl: text("target_url"),                       // zewnętrzny URL; null = wewnętrzna strona demo
  shareText: text("share_text").notNull().default(""), // gotowy tekst polecający
  status: publishStatus("status").notNull().default("draft"),
  sort: integer("sort").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("asset_service_slug").on(t.serviceId, t.slug)]);

/* ---------- tracking ---------- */
export const referralLinks = pgTable("referral_links", {
  id: id(),
  token: text("token").notNull().unique(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").notNull().references(() => contentAssets.id, { onDelete: "cascade" }),
  stage: funnelStage("stage").notNull(),
  campaign: text("campaign").notNull().default(""),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("link_partner_asset_campaign").on(t.partnerId, t.assetId, t.campaign)]);

export const attributions = pgTable("attributions", {
  id: id(),
  token: text("token").notNull().unique(),   // publiczny token przekazywany jako ?pp_ref=
  visitorId: text("visitor_id").notNull(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  linkId: uuid("link_id").notNull().references(() => referralLinks.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
}, (t) => [index("attr_visitor_service").on(t.visitorId, t.serviceId)]);

export const referralClicks = pgTable("referral_clicks", {
  id: id(),
  linkId: uuid("link_id").notNull().references(() => referralLinks.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  attributionId: uuid("attribution_id").references(() => attributions.id, { onDelete: "set null" }),
  visitorId: text("visitor_id").notNull(),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  referer: text("referer"),
  createdAt: createdAt(),
}, (t) => [index("click_link").on(t.linkId), index("click_partner").on(t.partnerId, t.createdAt)]);

/* ---------- leads, conversions, commissions ---------- */
export const leads = pgTable("leads", {
  id: id(),
  number: bigint("number", { mode: "number" }).notNull().unique().default(sql`nextval('lead_number_seq')`),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "restrict" }),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  attributionId: uuid("attribution_id").references(() => attributions.id, { onDelete: "set null" }),
  linkId: uuid("link_id").references(() => referralLinks.id, { onDelete: "set null" }),
  stage: funnelStage("stage"),
  source: leadSource("source").notNull(),
  status: leadStatus("status").notNull().default("registered"),
  externalId: text("external_id"),
  // dane kontaktowe klienta — widoczne wyłącznie dla administratora, nigdy dla partnera
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactHash: text("contact_hash"),   // HMAC(e-mail|telefon) do deduplikacji
  consentAt: ts("consent_at"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("lead_service_contact").on(t.serviceId, t.contactHash),
  uniqueIndex("lead_service_external").on(t.serviceId, t.externalId),
  index("lead_partner").on(t.partnerId, t.createdAt),
]);

export const leadEvents = pgTable("lead_events", {
  id: id(),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // created | status | assignment | conversion | refund
  fromValue: text("from_value"),
  toValue: text("to_value"),
  note: text("note"),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  actorLabel: text("actor_label"),
  createdAt: createdAt(),
}, (t) => [index("lead_event_lead").on(t.leadId)]);

export const conversions = pgTable("conversions", {
  id: id(),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "restrict" }),
  type: conversionType("type").notNull(),
  status: conversionStatus("status").notNull().default("confirmed"),
  netAmount: integer("net_amount"),  // grosze, wartość netto sprzedaży
  externalId: text("external_id"),
  source: leadSource("source").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("conversion_lead_type").on(t.leadId, t.type)]); // jedna konwersja danego typu na lead

export const payouts = pgTable("payouts", {
  id: id(),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "restrict" }),
  amount: integer("amount").notNull(),
  reference: text("reference").notNull().default(""),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

export const commissions = pgTable("commissions", {
  id: id(),
  conversionId: uuid("conversion_id").references(() => conversions.id, { onDelete: "restrict" }),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "restrict" }),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "restrict" }),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "restrict" }),
  kind: text("kind").notNull().default("commission"), // commission | correction
  // migawka warunków z chwili naliczenia — późniejsze zmiany stawek nie wpływają na historię
  model: commissionModel("model").notNull(),
  rateAmount: integer("rate_amount"),
  rateBps: integer("rate_bps"),
  rateSource: text("rate_source").notNull(), // service | partner | manual
  baseAmount: integer("base_amount"),
  amount: integer("amount").notNull(),
  status: commissionStatus("status").notNull().default("pending"),
  note: text("note"),
  payoutId: uuid("payout_id").references(() => payouts.id, { onDelete: "set null" }),
  approvedAt: ts("approved_at"),
  paidAt: ts("paid_at"),
  cancelledAt: ts("cancelled_at"),
  createdAt: createdAt(),
}, (t) => [
  // jedna aktywna prowizja (i jedna korekta) na konwersję; anulowane nie blokują ponownego naliczenia
  uniqueIndex("commission_conversion_kind").on(t.conversionId, t.kind).where(sql`status <> 'cancelled'`),
  index("commission_partner").on(t.partnerId, t.status),
]);

/* ---------- system ---------- */
export const webhookEvents = pgTable("webhook_events", {
  id: id(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  result: jsonb("result"),
  createdAt: createdAt(),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: id(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  actorLabel: text("actor_label").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  reason: text("reason"),
  createdAt: createdAt(),
}, (t) => [index("audit_entity").on(t.entity, t.entityId)]);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const landingFaqs = pgTable("landing_faqs", {
  id: id(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  published: boolean("published").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(1),
}, (t) => [primaryKey({ columns: [t.key, t.windowStart] })]);

/* ---------- relations ---------- */
export const usersRelations = relations(users, ({ one }) => ({
  partner: one(partners, { fields: [users.id], references: [partners.userId] }),
}));
export const partnersRelations = relations(partners, ({ one, many }) => ({
  user: one(users, { fields: [partners.userId], references: [users.id] }),
  profession: one(professions, { fields: [partners.professionSlug], references: [professions.slug] }),
  terms: many(partnerServiceTerms),
}));
export const companiesRelations = relations(companies, ({ many }) => ({ services: many(services) }));
export const servicesRelations = relations(services, ({ one, many }) => ({
  company: one(companies, { fields: [services.companyId], references: [companies.id] }),
  assets: many(contentAssets),
  professions: many(serviceProfessions),
}));
export const serviceProfessionsRelations = relations(serviceProfessions, ({ one }) => ({
  service: one(services, { fields: [serviceProfessions.serviceId], references: [services.id] }),
  profession: one(professions, { fields: [serviceProfessions.professionSlug], references: [professions.slug] }),
}));
export const partnerServiceTermsRelations = relations(partnerServiceTerms, ({ one }) => ({
  partner: one(partners, { fields: [partnerServiceTerms.partnerId], references: [partners.id] }),
  service: one(services, { fields: [partnerServiceTerms.serviceId], references: [services.id] }),
}));
export const contentAssetsRelations = relations(contentAssets, ({ one }) => ({
  service: one(services, { fields: [contentAssets.serviceId], references: [services.id] }),
}));
export const referralLinksRelations = relations(referralLinks, ({ one }) => ({
  partner: one(partners, { fields: [referralLinks.partnerId], references: [partners.id] }),
  service: one(services, { fields: [referralLinks.serviceId], references: [services.id] }),
  asset: one(contentAssets, { fields: [referralLinks.assetId], references: [contentAssets.id] }),
}));
export const leadsRelations = relations(leads, ({ one, many }) => ({
  service: one(services, { fields: [leads.serviceId], references: [services.id] }),
  partner: one(partners, { fields: [leads.partnerId], references: [partners.id] }),
  link: one(referralLinks, { fields: [leads.linkId], references: [referralLinks.id] }),
  events: many(leadEvents),
  conversions: many(conversions),
  commissions: many(commissions),
}));
export const leadEventsRelations = relations(leadEvents, ({ one }) => ({
  lead: one(leads, { fields: [leadEvents.leadId], references: [leads.id] }),
}));
export const conversionsRelations = relations(conversions, ({ one }) => ({
  lead: one(leads, { fields: [conversions.leadId], references: [leads.id] }),
}));
export const commissionsRelations = relations(commissions, ({ one }) => ({
  lead: one(leads, { fields: [commissions.leadId], references: [leads.id] }),
  partner: one(partners, { fields: [commissions.partnerId], references: [partners.id] }),
  service: one(services, { fields: [commissions.serviceId], references: [services.id] }),
  conversion: one(conversions, { fields: [commissions.conversionId], references: [conversions.id] }),
}));

export type Service = typeof services.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type User = typeof users.$inferSelect;
export type ContentAsset = typeof contentAssets.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type PartnerServiceTerm = typeof partnerServiceTerms.$inferSelect;
export type Profession = typeof professions.$inferSelect;
