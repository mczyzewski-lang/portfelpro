CREATE TABLE "partner_training" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"watched" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"best_score" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"certified_at" timestamp with time zone,
	"cert_number" text,
	"cert_area" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_training_cert_number_unique" UNIQUE("cert_number")
);
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "cert_area" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "training_videos" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "quiz" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "training_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "partner_training" ADD CONSTRAINT "partner_training_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_training" ADD CONSTRAINT "partner_training_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "partner_training_unique" ON "partner_training" USING btree ("partner_id","service_id");