CREATE TABLE "phone_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "pack_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "login_phone" text;--> statement-breakpoint
CREATE INDEX "phone_code_phone" ON "phone_codes" USING btree ("phone","created_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_login_phone_unique" UNIQUE("login_phone");