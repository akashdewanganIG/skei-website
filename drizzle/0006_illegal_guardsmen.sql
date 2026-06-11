CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spend_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"source" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text DEFAULT '' NOT NULL,
	"created_by" text DEFAULT '' NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "spend_connections_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
ALTER TABLE "spending_ledger" ADD COLUMN "external_ref" text;--> statement-breakpoint
ALTER TABLE "spending_ledger" ADD CONSTRAINT "spending_ledger_external_ref_unique" UNIQUE("external_ref");