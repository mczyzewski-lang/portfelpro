ALTER TABLE "partners" ADD COLUMN "public_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "public_slug" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "public_bio" text;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_public_slug_unique" UNIQUE("public_slug");