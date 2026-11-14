ALTER TABLE "companies" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "reference_videos" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "headline" text;