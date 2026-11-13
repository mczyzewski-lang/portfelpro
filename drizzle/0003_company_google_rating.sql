ALTER TABLE "companies" ADD COLUMN "google_rating" integer;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "google_reviews" integer;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "google_place_id" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "google_url" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "google_checked_at" timestamp with time zone;