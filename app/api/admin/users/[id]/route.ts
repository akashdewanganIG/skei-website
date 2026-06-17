import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { canManageUsers } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import {
  deleteAdminUser,
  listAdminUsers,
  parsePermissions,
  type UserInput,
  updateAdminUser,
} from "@/lib/auth/users";
import { isValidEmail, isValidUsername, toTrimmedString } from "@/lib/validation";
import type { Role } from "@/types/lead";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function roleFrom(value: unknown, fallback: Role): Role {
  return value === "admin" ? "admin" : value === "staff" ? "staff" : fallback;
}

async function requireAdminTarget(id: string, currentUsername: string) {
  const target = (await listAdminUsers()).find((user) => user.id === id);
  if (!target) return { error: error("User not found.", 404) };
  return { target, isSelf: target.username === currentUsername };
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return error("Unauthorized.", 401);
  if (!canManageUsers(session)) return error("Only admins can manage users.", 403);

  const { id } = await params;
  const resolved = await requireAdminTarget(id, session.username);
  if ("error" in resolved) return resolved.error;
  if (resolved.isSelf)
    return error("Use Account for your own password. Self-edits are disabled here.");

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return error("Invalid request.");
  }

  const input: Partial<UserInput> = {};

  if ("username" in body) {
    const username = toTrimmedString(body.username).toLowerCase();
    if (!isValidUsername(username)) {
      return error(
        "Username must be 3-32 characters using letters, numbers, dot, dash, or underscore.",
      );
    }
    input.username = username;
  }

  if ("name" in body) {
    input.name = toTrimmedString(body.name);
  }

  if ("email" in body) {
    const email = toTrimmedString(body.email).toLowerCase();
    if (!isValidEmail(email)) return error("Enter a valid email address.");
    input.email = email;
  }

  const role = roleFrom(body.role, resolved.target.role);
  if ("role" in body) input.role = role;
  if ("permissions" in body) input.permissions = parsePermissions(body.permissions);

  if ("password" in body) {
    const password = toTrimmedString(body.password);
    if (password && password.length < 8) return error("Password must be at least 8 characters.");
    if (password) input.password = password;
  }

  try {
    const user = await updateAdminUser(id, { ...input, role });
    await recordAuditLog(session, {
      action: "user.updated",
      entityType: "user",
      entityId: user.id,
      summary: `Updated ${user.username}`,
      metadata: {
        changed: Object.keys(input),
        role: user.role,
        permissions: user.permissions,
        passwordReset: Boolean(input.password),
      },
    });
    return NextResponse.json({ user });
  } catch (err) {
    console.error("Failed to update admin user:", err);
    return error("Could not update user. Username or email may already exist.", 409);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return error("Unauthorized.", 401);
  if (!canManageUsers(session)) return error("Only admins can manage users.", 403);

  const { id } = await params;
  const resolved = await requireAdminTarget(id, session.username);
  if ("error" in resolved) return resolved.error;
  if (resolved.isSelf) return error("You cannot delete your own account.");

  try {
    const deleted = await deleteAdminUser(id);
    await recordAuditLog(session, {
      action: "user.deleted",
      entityType: "user",
      entityId: id,
      summary: `Deleted ${deleted.username}`,
      metadata: {
        username: deleted.username,
        name: deleted.name,
        email: deleted.email,
        role: deleted.role,
        permissions: deleted.permissions,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete admin user:", err);
    return error("Could not delete user.", 502);
  }
}
