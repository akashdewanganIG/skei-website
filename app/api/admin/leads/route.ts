import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { listCampaignCategories } from "@/lib/campaigns";
import { isCampaignSourceName } from "@/lib/campaign-attribution";
import { createLead, listLeads } from "@/lib/leads";
import { getTrimmedString, isValidEmail, isValidIndianMobile } from "@/lib/validation";
import { LEAD_STATUSES, type Lead } from "@/types/lead";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "view_leads")) {
    return NextResponse.json(
      { error: "You do not have permission to view leads." },
      { status: 403 },
    );
  }

  try {
    const leads = await listLeads();
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Failed to list leads:", error);
    return NextResponse.json({ error: "Could not load leads." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "edit_leads")) {
    return NextResponse.json(
      { error: "You do not have permission to add leads." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const categories = await listCampaignCategories();
  const rawSource = getTrimmedString(body, "source");
  if (!isCampaignSourceName(rawSource, categories)) {
    return NextResponse.json(
      { error: "Choose a campaign source from Campaigns first." },
      { status: 400 },
    );
  }
  const source = rawSource;
  const status = LEAD_STATUSES.includes(body.status as Lead["status"])
    ? (body.status as Lead["status"])
    : "New";

  const input = {
    student_name: getTrimmedString(body, "student_name"),
    grade: getTrimmedString(body, "grade"),
    dob: getTrimmedString(body, "dob"),
    gender: getTrimmedString(body, "gender"),
    parent_name: getTrimmedString(body, "parent_name"),
    mobile_no: getTrimmedString(body, "mobile_no"),
    email: getTrimmedString(body, "email"),
    comment: getTrimmedString(body, "comment").slice(0, 2000),
    source,
    status,
    remark: getTrimmedString(body, "remark").slice(0, 2000),
    updated_by: session.name,
  };

  const missing = [];
  if (input.student_name.length < 2) missing.push("Student name");
  if (!input.grade) missing.push("Grade");
  if (!input.dob) missing.push("Date of birth");
  if (!input.gender) missing.push("Gender");
  if (input.parent_name.length < 2) missing.push("Parent name");
  if (!isValidIndianMobile(input.mobile_no)) missing.push("Valid 10-digit mobile number");
  if (input.email && !isValidEmail(input.email)) missing.push("Valid email");

  if (missing.length > 0) {
    const message = missing.length === 1 
      ? `${missing[0]} is required.`
      : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]} are required.`;
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }

  try {
    const lead = await createLead(input);
    await recordAuditLog(session, {
      action: "lead.created",
      entityType: "lead",
      entityId: lead.id,
      summary: `Created ${lead.student_name || "lead"}`,
      metadata: { source, status },
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Failed to create lead:", error);
    return NextResponse.json({ error: "Could not create lead." }, { status: 502 });
  }
}
