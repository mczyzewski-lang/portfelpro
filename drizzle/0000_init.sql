CREATE TYPE "public"."access_status" AS ENUM('requested', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('individual', 'sole_trader', 'company');--> statement-breakpoint
CREATE TYPE "public"."asset_type" AS ENUM('article', 'guide', 'webinar', 'video', 'quiz', 'calculator', 'landing', 'form', 'booking');--> statement-breakpoint
CREATE TYPE "public"."commission_model" AS ENUM('fixed', 'percent', 'qualified_lead', 'custom');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('pending', 'approved', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."conversion_status" AS ENUM('confirmed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."conversion_type" AS ENUM('sale', 'qualified_lead');--> statement-breakpoint
CREATE TYPE "public"."funnel_stage" AS ENUM('education', 'consultation', 'transaction');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('form', 'webhook', 'csv', 'manual');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('registered', 'qualified', 'in_progress', 'won', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."partner_status" AS ENUM('pending', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."rate_status" AS ENUM('tbd', 'demo', 'approved');--> statement-breakpoint
CREATE TYPE "public"."service_access" AS ENUM('open', 'approval_required');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('partner', 'admin');--> statement-breakpoint
CREATE SEQUENCE "public"."lead_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1001 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."partner_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 101 CACHE 1;--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"actor_label" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"visitor_id" text NOT NULL,
	"partner_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"link_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attributions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversion_id" uuid,
	"lead_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"kind" text DEFAULT 'commission' NOT NULL,
	"model" "commission_model" NOT NULL,
	"rate_amount" integer,
	"rate_bps" integer,
	"rate_source" text NOT NULL,
	"base_amount" integer,
	"amount" integer NOT NULL,
	"status" "commission_status" DEFAULT 'pending' NOT NULL,
	"note" text,
	"payout_id" uuid,
	"approved_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"logo_url" text,
	"color" text DEFAULT '#713B20' NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "content_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"stage" "funnel_stage" NOT NULL,
	"type" "asset_type" NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"target_url" text,
	"share_text" text DEFAULT '' NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" "conversion_type" NOT NULL,
	"status" "conversion_status" DEFAULT 'confirmed' NOT NULL,
	"net_amount" integer,
	"external_id" text,
	"source" "lead_source" NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landing_faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" text NOT NULL,
	"from_value" text,
	"to_value" text,
	"note" text,
	"actor_user_id" uuid,
	"actor_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" bigint DEFAULT nextval('lead_number_seq') NOT NULL,
	"service_id" uuid NOT NULL,
	"partner_id" uuid,
	"attribution_id" uuid,
	"link_id" uuid,
	"stage" "funnel_stage",
	"source" "lead_source" NOT NULL,
	"status" "lead_status" DEFAULT 'registered' NOT NULL,
	"external_id" text,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"contact_hash" text,
	"consent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "partner_service_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"access_status" "access_status",
	"custom_model" "commission_model",
	"custom_amount" integer,
	"custom_bps" integer,
	"note" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"number" bigint DEFAULT nextval('partner_number_seq') NOT NULL,
	"status" "partner_status" DEFAULT 'pending' NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"company_name" text,
	"nip" text,
	"profession_slug" text,
	"onboarded_at" timestamp with time zone,
	"first_success_seen_at" timestamp with time zone,
	"terms_accepted_at" timestamp with time zone NOT NULL,
	"terms_version" text NOT NULL,
	"marketing_consent_at" timestamp with time zone,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "partners_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professions" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"icon" text DEFAULT 'briefcase' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "rate_limits_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE "referral_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"attribution_id" uuid,
	"visitor_id" text NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"referer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"partner_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"stage" "funnel_stage" NOT NULL,
	"campaign" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "service_professions" (
	"service_id" uuid NOT NULL,
	"profession_slug" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	CONSTRAINT "service_professions_service_id_profession_slug_pk" PRIMARY KEY("service_id","profession_slug")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Inne' NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"access" "service_access" DEFAULT 'open' NOT NULL,
	"sensitive" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"client_benefit" text DEFAULT '' NOT NULL,
	"audience_short" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"problems" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"audience" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"when_to_recommend" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"arguments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pitch" text DEFAULT '' NOT NULL,
	"faq" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"do_not_promise" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provider" text DEFAULT '' NOT NULL,
	"commission_terms" text DEFAULT '' NOT NULL,
	"commission_model" "commission_model" DEFAULT 'custom' NOT NULL,
	"commission_amount" integer,
	"commission_bps" integer,
	"commission_condition" text DEFAULT '' NOT NULL,
	"commission_note" text DEFAULT '' NOT NULL,
	"rate_status" "rate_status" DEFAULT 'tbd' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'partner' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attributions" ADD CONSTRAINT "attributions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attributions" ADD CONSTRAINT "attributions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attributions" ADD CONSTRAINT "attributions_link_id_referral_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."referral_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_conversion_id_conversions_id_fk" FOREIGN KEY ("conversion_id") REFERENCES "public"."conversions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_attribution_id_attributions_id_fk" FOREIGN KEY ("attribution_id") REFERENCES "public"."attributions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_link_id_referral_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."referral_links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_service_terms" ADD CONSTRAINT "partner_service_terms_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_service_terms" ADD CONSTRAINT "partner_service_terms_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_profession_slug_professions_slug_fk" FOREIGN KEY ("profession_slug") REFERENCES "public"."professions"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_link_id_referral_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."referral_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_attribution_id_attributions_id_fk" FOREIGN KEY ("attribution_id") REFERENCES "public"."attributions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_asset_id_content_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."content_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_professions" ADD CONSTRAINT "service_professions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_professions" ADD CONSTRAINT "service_professions_profession_slug_professions_slug_fk" FOREIGN KEY ("profession_slug") REFERENCES "public"."professions"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity" ON "admin_audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "attr_visitor_service" ON "attributions" USING btree ("visitor_id","service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_conversion_kind" ON "commissions" USING btree ("conversion_id","kind") WHERE status <> 'cancelled';--> statement-breakpoint
CREATE INDEX "commission_partner" ON "commissions" USING btree ("partner_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_service_slug" ON "content_assets" USING btree ("service_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "conversion_lead_type" ON "conversions" USING btree ("lead_id","type");--> statement-breakpoint
CREATE INDEX "lead_event_lead" ON "lead_events" USING btree ("lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_service_contact" ON "leads" USING btree ("service_id","contact_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_service_external" ON "leads" USING btree ("service_id","external_id");--> statement-breakpoint
CREATE INDEX "lead_partner" ON "leads" USING btree ("partner_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pst_partner_service" ON "partner_service_terms" USING btree ("partner_id","service_id");--> statement-breakpoint
CREATE INDEX "click_link" ON "referral_clicks" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "click_partner" ON "referral_clicks" USING btree ("partner_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "link_partner_asset_campaign" ON "referral_links" USING btree ("partner_id","asset_id","campaign");