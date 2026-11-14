ALTER TABLE "services" ADD COLUMN "service_facts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "company_facts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "comparison" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "facts_demo" boolean DEFAULT false NOT NULL;