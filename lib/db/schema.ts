import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { type AdminPermission, LEAD_STATUSES, type Role } from "@/types/lead";

/** Pipeline status — mirrors LEAD_STATUSES so the type stays the single source. */
export const leadStatus = pgEnum("lead_status", LEAD_STATUSES);

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Ordering / "submitted on" — the Lead.submit_date string is derived from this.
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

  studentName: text("student_name").notNull().default(""),
  grade: text("grade").notNull().default(""),
  dob: text("dob").notNull().default(""),
  gender: text("gender").notNull().default(""),
  parentName: text("parent_name").notNull().default(""),
  mobileNo: text("mobile_no").notNull().default(""),
  email: text("email").notNull().default(""),
  comment: text("comment").notNull().default(""),
  source: text("source").notNull().default(""),
  utmSource: text("utm_source").notNull().default(""),
  utmMedium: text("utm_medium").notNull().default(""),
  utmCampaign: text("utm_campaign").notNull().default(""),
  utmTerm: text("utm_term").notNull().default(""),
  utmContent: text("utm_content").notNull().default(""),
  referrer: text("referrer").notNull().default(""),

  status: leadStatus("status").notNull().default("New"),
  remark: text("remark").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  updatedBy: text("updated_by").notNull().default(""),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

  username: text("username").notNull().unique(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  role: text("role").$type<Role>().notNull(),
  permissions: jsonb("permissions").$type<AdminPermission[]>().notNull().default([]),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  actorUsername: text("actor_username").notNull().default(""),
  actorName: text("actor_name").notNull().default(""),
  actorRole: text("actor_role").notNull().default(""),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull().default(""),
  summary: text("summary").notNull().default(""),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
});

export const marketingSpends = pgTable("spending_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  amount: text("amount").notNull().default("0"),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  addedBy: text("added_by").notNull().default("admin"),
});

export const leadCategories = pgTable("lead_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#3f7cac"),
  subcategories: jsonb("subcategories").$type<string[]>().notNull().default([]),
  utmTags: jsonb("utm_tags").$type<Record<string, string[]>>().notNull().default({}),
});

export type LeadRow = typeof leads.$inferSelect;
export type NewLeadRow = typeof leads.$inferInsert;
export type AdminUserRow = typeof adminUsers.$inferSelect;
export type NewAdminUserRow = typeof adminUsers.$inferInsert;
export type AuditLogRow = typeof auditLogs.$inferSelect;
export type MarketingSpendRow = typeof marketingSpends.$inferSelect;
