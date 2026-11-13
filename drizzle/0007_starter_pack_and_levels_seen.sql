ALTER TABLE "partners" ADD COLUMN "starter_code" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "starter_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "gamification_seen" jsonb;