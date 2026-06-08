ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'Phone' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_source" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_medium" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_campaign" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_term" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_content" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "referrer" text DEFAULT '' NOT NULL;--> statement-breakpoint
INSERT INTO "lead_categories" ("name", "color", "subcategories")
VALUES
	('Meta', '#d9481e', '["Facebook","Instagram"]'::jsonb),
	('Google', '#3f7cac', '["GMB","Google Ads","Google Search"]'::jsonb),
	('Phone', '#857a6b', '["Phone"]'::jsonb)
ON CONFLICT ("name") DO UPDATE
SET "color" = EXCLUDED."color", "subcategories" = EXCLUDED."subcategories";
