import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { deleteLead, updateLead } from "@/lib/leads";
import { EDITABLE_LEAD_FIELDS, LEAD_STATUSES, type Lead } from "@/types/lead";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const patch: Partial<Omit<Lead, "id">> = {};

  // Remarks: available to anyone with the remark permission.
  if (typeof body.remark === "string") {
    if (!hasPermission(session, "edit_remarks")) {
      return NextResponse.json(
        { error: "You do not have permission to edit remarks." },
        { status: 403 },
      );
    }
    patch.remark = body.remark.slice(0, 2000);
  }

  // Status and field corrections are permission-driven.
  if (body.status !== undefined) {
    if (!hasPermission(session, "manage_status")) {
      return NextResponse.json(
        { error: "You do not have permission to change status." },
        { status: 403 },
      );
    }
    if (!LEAD_STATUSES.includes(body.status as Lead["status"])) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    patch.status = body.status as Lead["status"];
  }

  for (const field of EDITABLE_LEAD_FIELDS) {
    if (body[field] === undefined) continue;
    if (!hasPermission(session, "edit_leads")) {
      return NextResponse.json(
        { error: "You do not have permission to edit lead details." },
        { status: 403 },
      );
    }
    patch[field] = String(body[field]);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const lead = await updateLead(id, patch, session.name);
    const changed = Object.keys(patch);
    await recordAuditLog(session, {
      action: changed.includes("status")
        ? "lead.status_changed"
        : changed.includes("remark")
          ? "lead.remark_updated"
          : "lead.updated",
      entityType: "lead",
      entityId: id,
      summary: `Updated ${lead.student_name || "lead"}`,
      metadata: { changed },
    });
    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Failed to update lead:", error);
    return NextResponse.json({ error: "Could not update lead." }, { status: 502 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "delete_leads")) {
    return NextResponse.json(
      { error: "You do not have permission to delete leads." },
      { status: 403 },
    );
  }

  const { id } = await params;
  try {
    const lead = await deleteLead(id);
    await recordAuditLog(session, {
      action: "lead.deleted",
      entityType: "lead",
      entityId: id,
      summary: `Deleted ${lead.student_name || "lead"}`,
      metadata: {
        studentName: lead.student_name,
        grade: lead.grade,
        status: lead.status,
        source: lead.source,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return NextResponse.json({ error: "Could not delete lead." }, { status: 502 });
  }
}
