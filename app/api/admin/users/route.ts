import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { canManageUsers } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { createAdminUser, listAdminUsers, parsePermissions } from "@/lib/auth/users";
import { getTrimmedString, isValidEmail, isValidUsername } from "@/lib/validation";
import type { Role } from "@/types/lead";

export const runtime = "nodejs";

function roleFrom(value: unknown): Role {
  return value === "admin" ? "admin" : "staff";
}

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const session = await getSession();
  if (!session) return error("Unauthorized.", 401);
  if (!canManageUsers(session)) return error("Only admins can manage users.", 403);

  const users = await listAdminUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return error("Unauthorized.", 401);
  if (!canManageUsers(session)) return error("Only admins can create users.", 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return error("Invalid request.");
  }

  const username = getTrimmedString(body, "username").toLowerCase();
  const name = getTrimmedString(body, "name");
  const email = getTrimmedString(body, "email").toLowerCase();
  const password = getTrimmedString(body, "password");
  const role = roleFrom(body.role);
  const permissions = parsePermissions(body.permissions);

  if (!isValidUsername(username)) {
    return error(
      "Username must be 3-32 characters using letters, numbers, dot, dash, or underscore.",
    );
  }
  if (!isValidEmail(email)) return error("Enter a valid email address.");
  if (password.length < 8) return error("Password must be at least 8 characters.");

  try {
    const user = await createAdminUser({ username, name, email, role, permissions, password });
    await recordAuditLog(session, {
      action: "user.created",
      entityType: "user",
      entityId: user.id,
      summary: `Created ${user.username}`,
      metadata: { role: user.role, permissions: user.permissions },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("Failed to create admin user:", err);
    return error("Could not create user. Username or email may already exist.", 409);
  }
}
