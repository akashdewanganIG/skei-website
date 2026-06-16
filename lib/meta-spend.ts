import { eq } from "drizzle-orm";
import { hasCampaignParent, listCampaignCategories } from "@/lib/campaigns";
import { dateOnlyToUtcDate } from "@/lib/date-only";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { upsertSpendEntry } from "@/lib/spend-automation";

/**
 * Meta (Facebook/Instagram) Ads spend sync. Config lives in `app_settings`
 * and is managed entirely from the dashboard's Spending → Automation panel,
 * so connecting an ad account never requires a code change.
 *
 * Pulls account-level daily spend from the Marketing API Insights endpoint
 * for the last few days each run (Meta restates recent spend), and upserts
 * into the ledger keyed by `meta:{accountId}:{date}`.
 */

const META_SETTINGS_KEY = "meta_spend_sync";
const GRAPH_VERSION = "v21.0";
/** Auto-sync (piggybacked on dashboard loads) runs at most this often. */
const SYNC_STALE_MS = 12 * 60 * 60 * 1000;
const SYNC_WINDOW_DAYS = 7;

export type MetaSyncConfig = {
  enabled: boolean;
  adAccountId: string;
  accessToken: string;
  source: string;
  lastSyncedAt: string;
  lastSyncError: string;
};

const DEFAULT_CONFIG: MetaSyncConfig = {
  enabled: false,
  adAccountId: "",
  accessToken: "",
  source: "",
  lastSyncedAt: "",
  lastSyncError: "",
};

export async function getMetaConfig(): Promise<MetaSyncConfig> {
  const rows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, META_SETTINGS_KEY))
    .limit(1);
  return { ...DEFAULT_CONFIG, ...(rows[0]?.value as Partial<MetaSyncConfig> | undefined) };
}

export async function saveMetaConfig(config: MetaSyncConfig, updatedBy: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key: META_SETTINGS_KEY, value: config, updatedAt: new Date(), updatedBy })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: config, updatedAt: new Date(), updatedBy },
    });
}

export type MetaSyncResult = { synced: number; skipped: boolean; error?: string };

export async function syncMetaSpend(options: { force?: boolean } = {}): Promise<MetaSyncResult> {
  const config = await getMetaConfig();
  if (!config.enabled || !config.adAccountId || !config.accessToken || !config.source) {
    return { synced: 0, skipped: true };
  }
  if (
    !options.force &&
    config.lastSyncedAt &&
    Date.now() - new Date(config.lastSyncedAt).getTime() < SYNC_STALE_MS
  ) {
    return { synced: 0, skipped: true };
  }

  const categories = await listCampaignCategories();
  if (!hasCampaignParent(categories, config.source)) {
    const error = `Campaign group "${config.source}" no longer exists. Update the Meta sync settings.`;
    await saveMetaConfig({ ...config, lastSyncError: error }, "meta-sync");
    return { synced: 0, skipped: false, error };
  }

  const accountId = config.adAccountId.trim().replace(/^act_/, "");
  const formatDay = (date: Date) => date.toISOString().slice(0, 10);
  const until = new Date();
  const since = new Date(until.getTime() - SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    level: "account",
    fields: "spend",
    time_increment: "1",
    time_range: JSON.stringify({ since: formatDay(since), until: formatDay(until) }),
    access_token: config.accessToken,
  });

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/act_${accountId}/insights?${params}`,
      { cache: "no-store" },
    );
    const data = (await response.json().catch(() => ({}))) as {
      data?: { spend?: string; date_start?: string }[];
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new Error(data.error?.message || `Meta API request failed (${response.status}).`);
    }

    let synced = 0;
    for (const row of data.data ?? []) {
      const amount = Number(row.spend);
      const date = typeof row.date_start === "string" ? row.date_start : "";
      const spendDate = dateOnlyToUtcDate(date);
      if (!spendDate || !Number.isFinite(amount) || amount <= 0) continue;
      await upsertSpendEntry({
        source: config.source,
        amount,
        date: spendDate,
        externalRef: `meta:${accountId}:${date}`,
        addedBy: "Meta Ads sync",
      });
      synced += 1;
    }

    await saveMetaConfig(
      { ...config, lastSyncedAt: new Date().toISOString(), lastSyncError: "" },
      "meta-sync",
    );
    return { synced, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta sync failed.";
    await saveMetaConfig({ ...config, lastSyncError: message }, "meta-sync");
    return { synced: 0, skipped: false, error: message };
  }
}
