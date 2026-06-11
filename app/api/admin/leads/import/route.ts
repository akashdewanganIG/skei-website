import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { createLead, listLeads } from "@/lib/leads";
import { isValidEmail, isValidIndianMobile, normalizeMobile } from "@/lib/validation";
import type { Lead } from "@/types/lead";
import { LEAD_STATUSES } from "@/types/lead";

export const runtime = "nodejs";

function fingerprint(
  student_name: string,
  grade: string,
  dob: string,
  gender: string,
  parent_name: string,
  mobile_no: string,
  email: string,
  source: string,
  status: string,
  comment: string,
): string {
  return [
    student_name.trim().toLowerCase(),
    grade.trim().toLowerCase(),
    dob.trim(),
    gender.trim().toLowerCase(),
    parent_name.trim().toLowerCase(),
    normalizeMobile(mobile_no),
    email.trim().toLowerCase(),
    source.trim(),
    status.trim(),
    comment.trim(),
  ].join("\x00");
}

function leadFingerprint(l: Lead): string {
  return fingerprint(
    l.student_name, l.grade, l.dob, l.gender, l.parent_name,
    l.mobile_no, l.email, l.source, l.status, l.comment,
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "edit_leads")) {
    return NextResponse.json(
      { error: "You do not have permission to import leads." },
      { status: 403 },
    );
  }

  let body: { rows: Record<string, string>[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }

  const existingLeads = await listLeads();
  const existingFingerprints = new Set(existingLeads.map(leadFingerprint));
  const batchFingerprints = new Set<string>();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < body.rows.length; i++) {
    const row = body.rows[i];
    const rowNum = i + 2;

    const status = LEAD_STATUSES.includes(row.status as Lead["status"])
      ? (row.status as Lead["status"])
      : "New";

    const input = {
      student_name: row.student_name?.trim() ?? "",
      grade: row.grade?.trim() ?? "",
      dob: row.dob?.trim() ?? "",
      gender: row.gender?.trim() ?? "",
      parent_name: row.parent_name?.trim() ?? "",
      mobile_no: normalizeMobile(row.mobile_no ?? ""),
      email: row.email?.trim() ?? "",
      comment: (row.comment?.trim() ?? "").slice(0, 2000),
      source: row.source?.trim() ?? "",
      status,
      remark: (row.remark?.trim() ?? "").slice(0, 2000),
      updated_by: session.name,
    };

    const fp = fingerprint(
      input.student_name, input.grade, input.dob, input.gender, input.parent_name,
      input.mobile_no, input.email, input.source, input.status, input.comment,
    );

    if (existingFingerprints.has(fp) || batchFingerprints.has(fp)) {
      skipped++;
      errors.push(`Row ${rowNum}: Identical record already exists.`);
      continue;
    }

    const missing: string[] = [];
    if (input.student_name.length < 2) missing.push("student_name");
    if (!input.grade) missing.push("grade");
    if (!input.dob) missing.push("dob");
    if (!input.gender) missing.push("gender");
    if (input.parent_name.length < 2) missing.push("parent_name");
    if (!isValidIndianMobile(input.mobile_no)) missing.push("mobile_no");
    if (input.email && !isValidEmail(input.email)) missing.push("email");

    if (missing.length > 0) {
      skipped++;
      errors.push(`Row ${rowNum}: Invalid or missing fields: ${missing.join(", ")}.`);
      continue;
    }

    try {
      await createLead(input);
      batchFingerprints.add(fp);
      imported++;
    } catch (err) {
      skipped++;
      errors.push(`Row ${rowNum}: ${err instanceof Error ? err.message : "Failed to create."}`);
    }
  }

  if (imported > 0) {
    await recordAuditLog(session, {
      action: "leads.imported",
      entityType: "lead",
      entityId: "bulk",
      summary: `Imported ${imported} lead${imported !== 1 ? "s" : ""} via CSV`,
      metadata: { imported, skipped },
    });
  }

  return NextResponse.json({ imported, skipped, errors });
}
