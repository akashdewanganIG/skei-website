#!/usr/bin/env node
/**
 * Generate a scrypt password hash for the admin / staff accounts, and (with
 * --secret) a random AUTH_SECRET.
 *
 *   node scripts/hash-password.mjs "MyStrongPassword"
 *   node scripts/hash-password.mjs --secret
 */
import { scryptSync, randomBytes } from "node:crypto";

function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

const arg = process.argv[2];

if (!arg) {
  console.error('Usage: node scripts/hash-password.mjs "password"   |   --secret');
  process.exit(1);
}

if (arg === "--secret") {
  console.log(`\nAUTH_SECRET=${randomBytes(32).toString("hex")}\n`);
  process.exit(0);
}

console.log("\nPassword hash (paste into ADMIN_PASSWORD_HASH / STAFF_PASSWORD_HASH):\n");
console.log(`${hashPassword(arg)}\n`);
