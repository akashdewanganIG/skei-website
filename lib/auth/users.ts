import { asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { type AdminUserRow, adminUsers } from "@/lib/db/schema";
import { ADMIN_PERMISSIONS, type AdminPermission, type Role } from "@/types/lead";
import { hashPassword } from "./credentials";
import { normalizePermissions } from "./permissions";

export type AdminUserSummary = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  permissions: AdminPermission[];
  createdAt: string;
  emailVerifiedAt: string;
  lastLoginAt: string;
};

export type UserInput = {
  username: string;
  name: string;
  email: string;
  role: Role;
  permissions: AdminPermission[];
  password?: string;
};

function toSummary(user: AdminUserRow): AdminUserSummary {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: normalizePermissions(user.role, user.permissions),
    createdAt: user.createdAt.toISOString(),
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? "",
    lastLoginAt: user.lastLoginAt?.toISOString() ?? "",
  };
}

function normalizeIdentity(value: string): string {
  return value.trim().toLowerCase();
}

export function parsePermissions(value: unknown): AdminPermission[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (permission): permission is AdminPermission =>
      typeof permission === "string" && ADMIN_PERMISSIONS.includes(permission as AdminPermission),
  );
}

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const users = await db
    .select()
    .from(adminUsers)
    .orderBy(asc(adminUsers.role), asc(adminUsers.name));
  return users.map(toSummary);
}

export async function createAdminUser(input: UserInput): Promise<AdminUserSummary> {
  const [user] = await db
    .insert(adminUsers)
    .values({
      username: normalizeIdentity(input.username),
      name: input.name.trim(),
      email: normalizeIdentity(input.email),
      role: input.role,
      permissions: normalizePermissions(input.role, input.permissions),
      passwordHash: hashPassword(input.password ?? ""),
      emailVerifiedAt: new Date(),
      passwordChangedAt: new Date(),
    })
    .returning();
  return toSummary(user);
}

export async function updateAdminUser(
  id: string,
  input: Partial<UserInput>,
): Promise<AdminUserSummary> {
  const set: Partial<typeof adminUsers.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.username !== undefined) set.username = normalizeIdentity(input.username);
  if (input.name !== undefined) set.name = input.name.trim();
  if (input.email !== undefined) set.email = normalizeIdentity(input.email);
  if (input.role !== undefined) set.role = input.role;
  if (input.permissions !== undefined) {
    set.permissions = normalizePermissions(input.role ?? "staff", input.permissions);
  }
  if (input.password) {
    set.passwordHash = hashPassword(input.password);
    set.passwordChangedAt = new Date();
  }

  const [user] = await db
    .update(adminUsers)
    .set(set)
    .where(sql`${adminUsers.id} = ${id}`)
    .returning();
  if (!user) throw new Error("User not found.");
  return toSummary(user);
}

export async function deleteAdminUser(id: string): Promise<AdminUserSummary> {
  const [user] = await db.delete(adminUsers).where(sql`${adminUsers.id} = ${id}`).returning();
  if (!user) throw new Error("User not found.");
  return toSummary(user);
}
