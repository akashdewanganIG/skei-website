import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { type LeadRow, leads } from "./db/schema";
import type { Lead } from "@/types/lead";

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
    status: row.status,
    remark: row.remark,
    updated_at: row.updatedAt ? formatDateTime(row.updatedAt) : "",
    updated_by: row.updatedBy,
  };
}

/** Fields a public enquiry may set. */
type EnquiryInput = Partial<
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
  >
>;

export async function listLeads(): Promise<Lead[]> {
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  return rows.map(toLead);
}

export async function createLead(input: EnquiryInput): Promise<Lead> {
  const [row] = await db
    .insert(leads)
    .values({
      studentName: input.student_name ?? "",
      grade: input.grade ?? "",
      dob: input.dob ?? "",
      gender: input.gender ?? "",
      parentName: input.parent_name ?? "",
      mobileNo: input.mobile_no ?? "",
      email: input.email ?? "",
      comment: input.comment ?? "",
    })
    .returning();
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

  const [row] = await db.update(leads).set(set).where(eq(leads.id, id)).returning();
  if (!row) throw new Error("Lead not found.");
  return toLead(row);
}

export async function deleteLead(id: string): Promise<void> {
  await db.delete(leads).where(eq(leads.id, id));
}
