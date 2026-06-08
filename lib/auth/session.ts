import { cookies } from "next/headers";
import type { Role, Session } from "@/types/lead";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "./constants";
import { signToken, verifyToken } from "./jwt";
import { normalizePermissions } from "./permissions";

export { SESSION_COOKIE, SESSION_MAX_AGE };

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set.");
  return secret;
}

export async function createSessionToken(session: Session): Promise<string> {
  return signToken(
    {
      sub: session.username,
      email: session.email,
      role: session.role,
      name: session.name,
      permissions: session.permissions,
    },
    getSecret(),
    SESSION_MAX_AGE,
  );
}

/** Reads and verifies the session cookie. Returns null when unauthenticated. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const payload = await verifyToken(token, secret);
  if (!payload) return null;

  const role = payload.role as Role;
  return {
    username: payload.sub,
    email: payload.email ?? "",
    role,
    name: payload.name,
    permissions: normalizePermissions(role, payload.permissions),
  };
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
