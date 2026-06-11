"use client";

import {
  RiDeleteBinLine,
  RiFileCopyLine,
  RiKey2Line,
  RiRefreshLine,
  RiSaveLine,
} from "@remixicon/react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { campaignParentOptions } from "@/lib/campaign-attribution";
import type { CampaignCategory, MetaSyncStatus, SpendConnection } from "../portal-types";
import { EmptyInline } from "./empty-states";
import { SelectField, TextInput } from "./form-fields";

function copyText(value: string, label: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`${label} copied.`))
    .catch(() => toast.error("Could not copy. Select and copy manually."));
}

function formatWhen(value: string | null | undefined): string {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString("en-IN");
}

function googleAdsScript(url: string, key: string): string {
  return `// Google Ads → Tools → Scripts → new script. Schedule it daily.
var WEBHOOK_URL = "${url}";
var API_KEY = "${key}";

function main() {
  var account = AdsApp.currentAccount();
  var date = Utilities.formatDate(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
    account.getTimeZone(),
    "yyyy-MM-dd"
  );
  var cost = account.getStatsFor("YESTERDAY").getCost();
  if (cost <= 0) return;
  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + API_KEY },
    payload: JSON.stringify({ amount: cost, date: date }),
    muteHttpExceptions: true
  });
}`;
}

function curlExample(url: string, key: string): string {
  return `curl -X POST ${url} \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 2500, "date": "2026-06-10"}'`;
}

function SnippetBlock({ title, snippet }: { title: string; snippet: string }) {
  return (
    <details className="rounded-lg border border-line bg-bg/45">
      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-fg">{title}</summary>
      <div className="border-t border-line p-3">
        <pre className="max-h-64 overflow-auto rounded-lg bg-fg/[0.04] p-3 text-[0.7rem] leading-relaxed text-fg">
          {snippet}
        </pre>
        <button
          type="button"
          onClick={() => copyText(snippet, "Snippet")}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-fg/75 transition-colors hover:bg-fg/[0.04] hover:text-fg"
        >
          <RiFileCopyLine className="h-3.5 w-3.5" />
          Copy snippet
        </button>
      </div>
    </details>
  );
}

export function SpendingAutomation({
  categories,
  onSpendsChanged,
}: {
  categories: CampaignCategory[];
  onSpendsChanged: () => void;
}) {
  // Only campaign groups flagged as ad platforms in Campaigns are offered here;
  // offline groups (referrals, print, …) stay manual-only.
  const parentOptions = useMemo(
    () => campaignParentOptions(categories.filter((category) => category.adPlatform)),
    [categories],
  );
  // The Meta sync only ever pulls Meta spend, so its dropdown offers just the
  // Meta-looking groups. If none match by name, fall back to all ad platforms
  // rather than locking the feature out over a naming choice.
  const metaParentOptions = useMemo(() => {
    const matches = parentOptions.filter((option) =>
      /\b(meta|facebook|instagram|fb|insta)\b/i.test(option.value),
    );
    return matches.length > 0 ? matches : parentOptions;
  }, [parentOptions]);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const ingestUrl = `${origin}/api/spend-ingest`;

  const [connections, setConnections] = useState<SpendConnection[]>([]);
  const [connName, setConnName] = useState("");
  const [connSource, setConnSource] = useState(parentOptions[0]?.value ?? "");
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<{ name: string; key: string } | null>(null);

  const [meta, setMeta] = useState<MetaSyncStatus | null>(null);
  const [metaAccountId, setMetaAccountId] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [metaSource, setMetaSource] = useState("");
  const [metaEnabled, setMetaEnabled] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [syncingMeta, setSyncingMeta] = useState(false);

  const activeConnSource = parentOptions.some((option) => option.value === connSource)
    ? connSource
    : (parentOptions[0]?.value ?? "");
  const selectedConnSource =
    parentOptions.find((option) => option.value === activeConnSource) ?? parentOptions[0];
  const selectedMetaSource =
    metaParentOptions.find((option) => option.value === metaSource) ?? metaParentOptions[0];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [connRes, metaRes] = await Promise.all([
          fetch("/api/admin/spend-connections", { cache: "no-store" }),
          fetch("/api/admin/integrations/meta", { cache: "no-store" }),
        ]);
        const [connData, metaData] = await Promise.all([
          connRes.json().catch(() => ({})),
          metaRes.json().catch(() => ({})),
        ]);
        if (cancelled) return;

        if (connRes.ok && Array.isArray(connData.connections)) {
          setConnections(connData.connections as SpendConnection[]);
        }
        if (metaRes.ok && metaData.meta) {
          const status = metaData.meta as MetaSyncStatus;
          setMeta(status);
          setMetaAccountId(status.adAccountId);
          setMetaSource(status.source);
          setMetaEnabled(status.enabled);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load automation settings.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateConnection = async (event: FormEvent) => {
    event.preventDefault();
    if (!connName.trim() || !activeConnSource) {
      return toast.error("Connection name and campaign group are required.");
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/spend-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: connName.trim(), source: activeConnSource }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to create connection.");

      setConnections([data.connection as SpendConnection, ...connections]);
      setCreatedKey({ name: connName.trim(), key: data.key as string });
      setConnName("");
      toast.success("Connection created. Copy the key now — it is shown only once.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create connection.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConnection = async (connection: SpendConnection) => {
    if (!confirm(`Revoke "${connection.name}"? Anything still using this key will stop working.`)) {
      return;
    }
    try {
      const response = await fetch(
        `/api/admin/spend-connections?id=${encodeURIComponent(connection.id)}`,
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to revoke connection.");
      setConnections(connections.filter((item) => item.id !== connection.id));
      toast.success("Connection revoked.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke connection.");
    }
  };

  const handleSaveMeta = async (event: FormEvent) => {
    event.preventDefault();
    setSavingMeta(true);
    try {
      const response = await fetch("/api/admin/integrations/meta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAccountId: metaAccountId.trim(),
          accessToken: metaToken.trim(),
          source: metaSource || (metaParentOptions[0]?.value ?? ""),
          enabled: metaEnabled,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to save Meta sync settings.");

      setMeta(data.meta as MetaSyncStatus);
      setMetaToken("");
      toast.success("Meta sync settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save Meta sync settings.");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSyncMeta = async () => {
    setSyncingMeta(true);
    try {
      const response = await fetch("/api/admin/integrations/meta", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Meta sync failed.");

      if (data.meta) setMeta(data.meta as MetaSyncStatus);
      toast.success(`Meta sync complete — ${data.synced} day(s) of spend updated.`);
      onSpendsChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Meta sync failed.");
    } finally {
      setSyncingMeta(false);
    }
  };

  return (
    <section>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface shadow-soft">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-sm font-semibold text-fg">Platform connections</h3>
            <p className="mt-1 text-xs text-muted">
              Works with anything that can send HTTP: Google Ads Scripts, Zapier, Make, custom jobs.
              Create a key, paste the snippet into the platform, done.
            </p>
          </div>

          <div className="space-y-4 p-4">
            {parentOptions.length === 0 ? (
              <EmptyInline text="No ad-platform groups yet. In Campaigns, tick “Paid ad platform” on the groups you want to automate." />
            ) : (
              <form
                onSubmit={handleCreateConnection}
                className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <TextInput
                  label="Connection name"
                  value={connName}
                  onChange={setConnName}
                  placeholder="Google Ads daily push"
                  required
                />
                <SelectField
                  label="Campaign group"
                  instanceId="connection-campaign-group"
                  options={parentOptions}
                  value={selectedConnSource}
                  onChange={(option) => setConnSource(option.value)}
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="flex h-10 items-center justify-center gap-2 self-end rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RiKey2Line className="h-4 w-4" />
                  {creating ? "Creating..." : "Create key"}
                </button>
              </form>
            )}

            {createdKey && (
              <div className="space-y-3 rounded-lg border border-clay/35 bg-clay/[0.06] p-3">
                <p className="text-xs font-semibold text-clay-deep">
                  Key for “{createdKey.name}” — copy it now, it will not be shown again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-fg/[0.05] px-2.5 py-2 text-xs text-fg">
                    {createdKey.key}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(createdKey.key, "API key")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs font-semibold text-fg/75 transition-colors hover:text-fg"
                  >
                    <RiFileCopyLine className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-fg/[0.05] px-2.5 py-2 text-xs text-fg">
                    {ingestUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(ingestUrl, "Webhook URL")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs font-semibold text-fg/75 transition-colors hover:text-fg"
                  >
                    <RiFileCopyLine className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
                <SnippetBlock
                  title="Google Ads — daily push script (ready to paste)"
                  snippet={googleAdsScript(ingestUrl, createdKey.key)}
                />
                <SnippetBlock
                  title="Any platform — HTTP example (Zapier, Make, curl)"
                  snippet={curlExample(ingestUrl, createdKey.key)}
                />
                <button
                  type="button"
                  onClick={() => setCreatedKey(null)}
                  className="text-xs font-semibold text-clay underline-offset-2 hover:underline"
                >
                  Done — I have copied the key
                </button>
              </div>
            )}

            <div className="divide-y divide-line rounded-lg border border-line">
              {connections.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-muted">
                  No connections yet. Create a key to start pushing spend automatically.
                </p>
              ) : (
                connections.map((connection) => (
                  <div key={connection.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-fg">{connection.name}</div>
                      <div className="truncate text-xs text-muted">
                        {connection.source} · {connection.keyPrefix} · Last used:{" "}
                        {formatWhen(connection.lastUsedAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteConnection(connection)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-clay/10 hover:text-clay"
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface shadow-soft">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-sm font-semibold text-fg">Meta Ads sync</h3>
            <p className="mt-1 text-xs text-muted">
              Pulls daily spend straight from the Meta Marketing API. Paste a long-lived access
              token from Business Settings → System users (needs <code>ads_read</code>).
            </p>
          </div>

          <form onSubmit={handleSaveMeta} className="grid gap-4 p-4">
            <TextInput
              label="Ad account ID"
              value={metaAccountId}
              onChange={setMetaAccountId}
              placeholder="act_1234567890"
            />
            <TextInput
              label="Access token"
              type="password"
              value={metaToken}
              onChange={setMetaToken}
              placeholder={meta?.hasToken ? "Saved — paste a new token to replace" : "EAAB..."}
            />
            {parentOptions.length === 0 ? (
              <EmptyInline text="No ad-platform groups yet. In Campaigns, tick “Paid ad platform” on the groups you want to automate." />
            ) : (
              <SelectField
                label="Log spend against"
                instanceId="meta-campaign-group"
                options={metaParentOptions}
                value={selectedMetaSource}
                onChange={(option) => setMetaSource(option.value)}
              />
            )}
            <label className="flex items-center gap-2 text-sm text-fg">
              <input
                type="checkbox"
                checked={metaEnabled}
                onChange={(event) => setMetaEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-line accent-[var(--color-clay,#d9481e)]"
              />
              Sync automatically (runs when the dashboard loads, at most every 12 hours)
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={savingMeta}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RiSaveLine className="h-4 w-4" />
                {savingMeta ? "Saving..." : "Save settings"}
              </button>
              <button
                type="button"
                onClick={handleSyncMeta}
                disabled={syncingMeta || !meta?.enabled}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-bg/55 px-4 text-sm font-semibold text-fg/75 transition-colors hover:bg-fg/[0.04] hover:text-fg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RiRefreshLine className={`h-4 w-4 ${syncingMeta ? "animate-spin" : ""}`} />
                {syncingMeta ? "Syncing..." : "Sync now"}
              </button>
            </div>

            <div className="text-xs text-muted">
              Last synced: {formatWhen(meta?.lastSyncedAt)}
              {meta?.lastSyncError && (
                <span className="mt-1 block text-clay">Last error: {meta.lastSyncError}</span>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
