CREATE TABLE IF NOT EXISTS "lead_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3f7cac' NOT NULL,
	"subcategories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "lead_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
INSERT INTO "lead_categories" ("name", "color", "subcategories")
VALUES
	('Meta', '#d9481e', '["Facebook","Instagram"]'::jsonb),
	('Google', '#3f7cac', '["GMB","Google Ads","Google Search"]'::jsonb),
	('Phone', '#857a6b', '["Phone"]'::jsonb)
ON CONFLICT ("name") DO UPDATE
SET "color" = EXCLUDED."color", "subcategories" = EXCLUDED."subcategories";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spending_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"amount" text DEFAULT '0' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"added_by" text DEFAULT 'admin' NOT NULL
);
