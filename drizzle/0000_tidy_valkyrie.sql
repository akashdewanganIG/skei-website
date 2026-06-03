CREATE TYPE "public"."lead_status" AS ENUM('New', 'Contacted', 'Visit Scheduled', 'Admitted', 'Closed');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"student_name" text DEFAULT '' NOT NULL,
	"grade" text DEFAULT '' NOT NULL,
	"dob" text DEFAULT '' NOT NULL,
	"gender" text DEFAULT '' NOT NULL,
	"parent_name" text DEFAULT '' NOT NULL,
	"mobile_no" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"status" "lead_status" DEFAULT 'New' NOT NULL,
	"remark" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone,
	"updated_by" text DEFAULT '' NOT NULL
);
