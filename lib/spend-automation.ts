import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { CampaignCategory } from "@/lib/campaign-attribution";
import { db } from "@/lib/db";
import {
  type MarketingSpendRow,
  marketingSpends,
  type SpendConnectionRow,
  spendConnections,
} from "@/lib/db/schema";

/**
 * Spend automation: ad platforms push spend through `/api/spend-ingest`
 * authenticated by a per-connection API key, or the Meta sync pulls it.
 * Both paths land in the same `spending_ledger`, deduplicated by
 * `external_ref` so daily re-pushes update rather than duplicate.
 */

export const INGEST_KEY_PREFIX = "skei_";

/** Keys are random secrets; only the SHA-256 hash is stored. */
export function generateIngestKey(): string {
  return `${INGEST_KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
}

export function hashIngestKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function findConnectionByKey(key: string): Promise<SpendConnectionRow | null> {
  if (!key.startsWith(INGEST_KEY_PREFIX)) return null;
  const rows = await db
    .select()
    .from(spendConnections)
    .where(eq(spendConnections.keyHash, hashIngestKey(key)))
    .limit(1);
  return rows[0] ?? null;
}

export async function touchConnection(id: string): Promise<void> {
  await db
    .update(spendConnections)
    .set({ lastUsedAt: new Date() })
    .where(eq(spendConnections.id, id));
}

/** Resolves a pushed source to the canonical campaign-group name, or null. */
export function resolveCampaignParent(
  categories: Pick<CampaignCategory, "name">[],
  value: string,
): string | null {
  const normalized = value.trim().toLowerCase();
  return (
    categories.find((category) => category.name.trim().toLowerCase() === normalized)?.name ?? null
  );
}

export type SpendEntryInput = {
  source: string;
  amount: number;
  date: Date;
  externalRef: string;
  addedBy: string;
};

/** Insert-or-update keyed on externalRef so platforms can restate a day's spend. */
export async function upsertSpendEntry(entry: SpendEntryInput): Promise<MarketingSpendRow> {
  const [row] = await db
    .insert(marketingSpends)
    .values({
      source: entry.source,
      amount: String(entry.amount),
      date: entry.date,
      addedBy: entry.addedBy,
      externalRef: entry.externalRef,
    })
    .onConflictDoUpdate({
      target: marketingSpends.externalRef,
      set: {
        source: entry.source,
        amount: String(entry.amount),
        date: entry.date,
        addedBy: entry.addedBy,
      },
    })
    .returning();
  return row;
}
