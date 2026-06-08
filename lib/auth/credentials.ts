import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import type { Session } from "@/types/lead";
import { normalizePermissions } from "./permissions";

/**
 * Password hashing/verification using Node's scrypt. Runs only inside the
 * Node.js runtime (route handlers). Hashes are stored only in the admin_users
 * table as `scrypt$<saltHex>$<hashHex>`.
 */

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

async function findUser(identifier: string) {
  const candidate = identifier.trim().toLowerCase();
  if (!candidate) return null;

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(sql`
      lower(${adminUsers.username}) = ${candidate}
      or lower(${adminUsers.email}) = ${candidate}
    `)
    .limit(1);

  return user ?? null;
}

/** Returns the matching session identity, or null on bad credentials. */
export async function authenticate(identifier: string, password: string): Promise<Session | null> {
  const user = await findUser(identifier);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;

  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(sql`${adminUsers.id} = ${user.id}`);

  return {
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.name,
    permissions: normalizePermissions(user.role, user.permissions),
  };
}

export async function changePassword(
  username: string,
  currentPassword: string,
  nextPassword: string,
): Promise<Session | null> {
  const user = await findUser(username);
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) return null;

  await db
    .update(adminUsers)
    .set({
      passwordHash: hashPassword(nextPassword),
      passwordChangedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(sql`${adminUsers.id} = ${user.id}`);

  return {
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.name,
    permissions: normalizePermissions(user.role, user.permissions),
  };
}

export async function getUserByUsername(username: string): Promise<Session | null> {
  const user = await findUser(username);
  if (!user) return null;
  return {
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.name,
    permissions: normalizePermissions(user.role, user.permissions),
  };
}

export async function updateProfile(
  currentUsername: string,
  updates: { username?: string; email?: string; name?: string },
): Promise<Session | null> {
  const user = await findUser(currentUsername);
  if (!user) return null;

  const patch: { username?: string; email?: string; name?: string; updatedAt: Date } = { updatedAt: new Date() };
  if (updates.username) patch.username = updates.username;
  if (updates.email) patch.email = updates.email;
  if (updates.name !== undefined) patch.name = updates.name;

  await db.update(adminUsers).set(patch).where(sql`${adminUsers.id} = ${user.id}`);

  const updatedUser = await findUser(patch.username || user.username);
  if (!updatedUser) return null;

  return {
    username: updatedUser.username,
    email: updatedUser.email,
    role: updatedUser.role,
    name: updatedUser.name,
    permissions: normalizePermissions(updatedUser.role, updatedUser.permissions),
  };
}
