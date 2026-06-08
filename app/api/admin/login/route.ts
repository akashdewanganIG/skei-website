import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/credentials";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { identifier?: string; username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const identifier = (body.identifier ?? body.username ?? "").trim();
  const password = body.password ?? "";
  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Username or email and password are required." },
      { status: 400 },
    );
  }

  const session = await authenticate(identifier, password);
  if (!session) {
    return NextResponse.json({ error: "Invalid username, email, or password." }, { status: 401 });
  }

  const token = await createSessionToken(session);
  const response = NextResponse.json({
    ok: true,
    user: {
      username: session.username,
      email: session.email,
      name: session.name,
      role: session.role,
      permissions: session.permissions,
    },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
