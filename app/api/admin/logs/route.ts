import { NextResponse } from "next/server";
import { listAuditLogs } from "@/lib/audit";
import { hasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "view_logs")) {
    return NextResponse.json({ error: "You do not have permission to view logs." }, { status: 403 });
  }

  const logs = await listAuditLogs();
  return NextResponse.json({ logs });
}
