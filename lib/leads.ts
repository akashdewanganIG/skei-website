import { desc, eq } from "drizzle-orm";
import type { Lead } from "@/types/lead";
import { db } from "./db";
import { type LeadRow, leads } from "./db/schema";

/**
 * Server-side data access for leads, backed by PostgreSQL (Drizzle ORM).
 * Runs only on the server (route handlers / server components).
 */

const TZ = "Asia/Kolkata";

function parts(date: Date) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => p.find((x) => x.type === type)?.value ?? "";
  return { d: get("day"), mo: get("month"), y: get("year"), h: get("hour"), mi: get("minute") };
}

/** "dd-MM-yyyy" in IST, matching the previous spreadsheet format. */
function formatDate(date: Date): string {
  const { d, mo, y } = parts(date);
  return `${d}-${mo}-${y}`;
}

/** "dd-MM-yyyy HH:mm" in IST. */
function formatDateTime(date: Date): string {
  const { d, mo, y, h, mi } = parts(date);
  return `${d}-${mo}-${y} ${h}:${mi}`;
}

/** Map a DB row to the Lead shape consumed by the dashboard/API. */
function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    submit_date: formatDate(row.createdAt),
    student_name: row.studentName,
    grade: row.grade,
    dob: row.dob,
    gender: row.gender,
    parent_name: row.parentName,
    mobile_no: row.mobileNo,
    email: row.email,
    comment: row.comment,
    source: row.source,
    utm_source: row.utmSource,
    utm_medium: row.utmMedium,
    utm_campaign: row.utmCampaign,
    utm_term: row.utmTerm,
    utm_content: row.utmContent,
    referrer: row.referrer,
    status: row.status,
    remark: row.remark,
    updated_at: row.updatedAt ? formatDateTime(row.updatedAt) : "",
    updated_by: row.updatedBy,
  };
}

/** Fields a public enquiry or manual portal entry may set. */
type LeadInput = Partial<
  Pick<
    Lead,
    | "student_name"
    | "grade"
    | "dob"
    | "gender"
    | "parent_name"
    | "mobile_no"
    | "email"
    | "comment"
    | "source"
    | "utm_source"
    | "utm_medium"
    | "utm_campaign"
    | "utm_term"
    | "utm_content"
    | "referrer"
    | "status"
    | "remark"
    | "updated_by"
  >
>;

export async function listLeads(): Promise<Lead[]> {
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  return rows.map(toLead);
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const values: typeof leads.$inferInsert = {
    studentName: input.student_name ?? "",
    grade: input.grade ?? "",
    dob: input.dob ?? "",
    gender: input.gender ?? "",
    parentName: input.parent_name ?? "",
    mobileNo: input.mobile_no ?? "",
    email: input.email ?? "",
    comment: input.comment ?? "",
    source: input.source ?? "",
    utmSource: input.utm_source ?? "",
    utmMedium: input.utm_medium ?? "",
    utmCampaign: input.utm_campaign ?? "",
    utmTerm: input.utm_term ?? "",
    utmContent: input.utm_content ?? "",
    referrer: input.referrer ?? "",
    status: input.status ?? "New",
    remark: input.remark ?? "",
    updatedBy: input.updated_by ?? "",
  };
  if (input.updated_by) values.updatedAt = new Date();

  const [row] = await db.insert(leads).values(values).returning();
  return toLead(row);
}

export async function updateLead(
  id: string,
  patch: Partial<Omit<Lead, "id">>,
  updatedBy: string,
): Promise<Lead> {
  const set: Partial<typeof leads.$inferInsert> = {
    updatedAt: new Date(),
    updatedBy,
  };

  if (patch.status !== undefined) set.status = patch.status;
  if (patch.remark !== undefined) set.remark = patch.remark;
  if (patch.student_name !== undefined) set.studentName = patch.student_name;
  if (patch.grade !== undefined) set.grade = patch.grade;
  if (patch.dob !== undefined) set.dob = patch.dob;
  if (patch.gender !== undefined) set.gender = patch.gender;
  if (patch.parent_name !== undefined) set.parentName = patch.parent_name;
  if (patch.mobile_no !== undefined) set.mobileNo = patch.mobile_no;
  if (patch.email !== undefined) set.email = patch.email;
  if (patch.comment !== undefined) set.comment = patch.comment;
  if (patch.source !== undefined) set.source = patch.source;
  if (patch.utm_source !== undefined) set.utmSource = patch.utm_source;
  if (patch.utm_medium !== undefined) set.utmMedium = patch.utm_medium;
  if (patch.utm_campaign !== undefined) set.utmCampaign = patch.utm_campaign;
  if (patch.utm_term !== undefined) set.utmTerm = patch.utm_term;
  if (patch.utm_content !== undefined) set.utmContent = patch.utm_content;
  if (patch.referrer !== undefined) set.referrer = patch.referrer;

  const [row] = await db.update(leads).set(set).where(eq(leads.id, id)).returning();
  if (!row) throw new Error("Lead not found.");
  return toLead(row);
}

export async function deleteLead(id: string): Promise<Lead> {
  const [row] = await db.delete(leads).where(eq(leads.id, id)).returning();
  if (!row) throw new Error("Lead not found.");
  return toLead(row);
}
