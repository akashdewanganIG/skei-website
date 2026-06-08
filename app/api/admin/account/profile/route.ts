import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { recordAuditLog } from "@/lib/audit";
import { updateProfile } from "@/lib/auth/credentials";
import { createSessionToken, getSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { username?: string; email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const updates: { username?: string; email?: string; name?: string } = {};
  if (body.username?.trim()) updates.username = body.username.trim();
  if (body.email?.trim()) updates.email = body.email.trim();
  if (body.name !== undefined) updates.name = body.name.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  try {
    const newSession = await updateProfile(session.username, updates);
    if (!newSession) {
      return NextResponse.json({ error: "Profile update failed." }, { status: 500 });
    }

    const token = await createSessionToken(newSession);
    (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);

    await recordAuditLog(session, {
      action: "account.profile_updated",
      entityType: "user",
      entityId: newSession.username,
      summary: `${session.username} updated profile`,
      metadata: {
        changed: Object.keys(updates),
        previousUsername: session.username,
        username: newSession.username,
        email: newSession.email,
        name: newSession.name,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.code === "23505" || err.message?.includes("unique constraint")) {
      return NextResponse.json({ error: "Username or email is already taken." }, { status: 409 });
    }
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
  }
}
