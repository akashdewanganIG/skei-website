import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import type { Role, Session } from "@/types/lead";

/**
 * Password hashing/verification using Node's scrypt. Runs only inside the
 * Node.js runtime (the login route handler). Hashes are stored in env vars as
 * `scrypt$<saltHex>$<hashHex>`; generate them with `npm run hash-password`.
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

type Account = {
  username?: string;
  hash?: string;
  role: Role;
  name: string;
};

function getAccounts(): Account[] {
  return [
    {
      username: process.env.ADMIN_USERNAME,
      hash: process.env.ADMIN_PASSWORD_HASH,
      role: "admin",
      name: process.env.ADMIN_NAME || "Administrator",
    },
    {
      username: process.env.STAFF_USERNAME,
      hash: process.env.STAFF_PASSWORD_HASH,
      role: "staff",
      name: process.env.STAFF_NAME || "SKEI Staff",
    },
  ];
}

/** Returns the matching session identity, or null on bad credentials. */
export function authenticate(username: string, password: string): Session | null {
  const candidate = username.trim();
  for (const account of getAccounts()) {
    if (!account.username || !account.hash) continue;
    if (account.username !== candidate) continue;
    if (!verifyPassword(password, account.hash)) return null;
    return { username: account.username, role: account.role, name: account.name };
  }
  return null;
}
