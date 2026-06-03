import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { LEAD_STATUSES } from "@/types/lead";

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

  status: leadStatus("status").notNull().default("New"),
  remark: text("remark").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  updatedBy: text("updated_by").notNull().default(""),
});

export type LeadRow = typeof leads.$inferSelect;
export type NewLeadRow = typeof leads.$inferInsert;
