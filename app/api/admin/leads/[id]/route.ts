import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { updateLead, deleteLead } from "@/lib/leads";
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

  // Remarks: both roles may edit.
  if (typeof body.remark === "string") {
    patch.remark = body.remark.slice(0, 2000);
  }

  // Status and field corrections: admins only.
  if (body.status !== undefined) {
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Only admins can change status." }, { status: 403 });
    }
    if (!LEAD_STATUSES.includes(body.status as Lead["status"])) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    patch.status = body.status as Lead["status"];
  }

  for (const field of EDITABLE_LEAD_FIELDS) {
    if (body[field] === undefined) continue;
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Only admins can edit lead details." }, { status: 403 });
    }
    patch[field] = String(body[field]);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const lead = await updateLead(id, patch, session.name);
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
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only admins can delete leads." }, { status: 403 });
  }

  const { id } = await params;
  try {
    await deleteLead(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return NextResponse.json({ error: "Could not delete lead." }, { status: 502 });
  }
}
