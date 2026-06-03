import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Postgres connection + Drizzle client. Runs only on the server (Node runtime).
 *
 * The client is created lazily on first query (not at import time) so that
 * `next build` never fails when DATABASE_URL is absent, and a single client is
 * cached on `globalThis` so dev hot-reloads don't open a new pool each time.
 */

type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __skeiSql?: ReturnType<typeof postgres>;
  __skeiDb?: Db;
};

function getDb(): Db {
  if (globalForDb.__skeiDb) return globalForDb.__skeiDb;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  // `prepare: false` keeps this compatible with transaction-mode poolers
  // (PgBouncer, Supabase/Neon poolers).
  const sql = globalForDb.__skeiSql ?? postgres(url, { prepare: false });
  const instance = drizzle(sql, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__skeiSql = sql;
    globalForDb.__skeiDb = instance;
  }
  return instance;
}

/** Drizzle client; the underlying connection is established on first use. */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop, getDb());
  },
});
