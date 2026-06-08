import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { changePassword } from "@/lib/auth/credentials";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { currentPassword?: string; nextPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? "";
  const nextPassword = body.nextPassword ?? "";

  if (!currentPassword || nextPassword.length < 8) {
    return NextResponse.json(
      { error: "Current password and a new password of at least 8 characters are required." },
      { status: 400 },
    );
  }

  const updated = await changePassword(session.username, currentPassword, nextPassword);
  if (!updated) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  await recordAuditLog(session, {
    action: "account.password_changed",
    entityType: "user",
    entityId: session.username,
    summary: `${session.username} changed password`,
  });

  return NextResponse.json({ ok: true });
}
