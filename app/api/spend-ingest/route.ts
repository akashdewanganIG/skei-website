import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { listCampaignCategories } from "@/lib/campaigns";
import {
  findConnectionByKey,
  resolveCampaignParent,
  touchConnection,
  upsertSpendEntry,
} from "@/lib/spend-automation";

export const runtime = "nodejs";

/**
 * Public push endpoint for ad-platform spend. Authenticated with a connection
 * API key (created in Spending → Automation), not a dashboard session, so
 * Google Ads Scripts, Zapier/Make, or any HTTP client can call it.
 *
 * POST with `Authorization: Bearer <key>` (or `x-api-key`) and either a single
 * entry or `{ "entries": [...] }`:
 *   { "amount": 2500, "date": "2026-06-10", "source"?: "Google Ads", "externalRef"?: "..." }
 *
 * Entries are idempotent per connection+source+day (or per externalRef when
 * provided): pushing the same day again updates the amount.
 */

const MAX_ENTRIES = 100;

function extractKey(request: Request): string {
  const auth = request.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return request.headers.get("x-api-key")?.trim() ?? "";
}

function parseDay(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  const key = extractKey(request);
  if (!key) {
    return NextResponse.json(
      { error: "Missing API key. Send it as 'Authorization: Bearer <key>'." },
      { status: 401 },
    );
  }

  const connection = await findConnectionByKey(key);
  if (!connection) {
    return NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const rawEntries = Array.isArray(body.entries) ? body.entries : [body];
  if (rawEntries.length === 0 || rawEntries.length > MAX_ENTRIES) {
    return NextResponse.json(
      { error: `Send 1 to ${MAX_ENTRIES} entries per request.` },
      { status: 400 },
    );
  }

  const categories = await listCampaignCategories();
  const recorded: { source: string; amount: number; date: string }[] = [];
  const errors: { index: number; error: string }[] = [];

  for (const [index, raw] of rawEntries.entries()) {
    if (!raw || typeof raw !== "object") {
      errors.push({ index, error: "Entry must be an object." });
      continue;
    }
    const entry = raw as Record<string, unknown>;

    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push({ index, error: "'amount' must be a positive number." });
      continue;
    }

    const date = parseDay(entry.date);
    if (!date) {
      errors.push({ index, error: "'date' must be a valid date (YYYY-MM-DD)." });
      continue;
    }

    let source = connection.source;
    const requestedSource = typeof entry.source === "string" ? entry.source.trim() : "";
    if (requestedSource) {
      const resolved = resolveCampaignParent(categories, requestedSource);
      if (!resolved) {
        errors.push({
          index,
          error: `'source' must match a campaign group (got "${requestedSource}").`,
        });
        continue;
      }
      source = resolved;
    }

    const day = date.toISOString().slice(0, 10);
    const providedRef =
      typeof entry.externalRef === "string" && entry.externalRef.trim()
        ? entry.externalRef.trim()
        : "";
    // Namespaced by connection id so two connections can never collide.
    const externalRef = providedRef
      ? `conn:${connection.id}:${providedRef}`
      : `conn:${connection.id}:${source}:${day}`;

    try {
      await upsertSpendEntry({ source, amount, date, externalRef, addedBy: connection.name });
      recorded.push({ source, amount, date: day });
    } catch (error) {
      console.error("Spend ingest failed for entry:", error);
      errors.push({ index, error: "Could not save this entry." });
    }
  }

  if (recorded.length > 0) {
    await touchConnection(connection.id).catch(() => {});
    await recordAuditLog(
      { username: `connection:${connection.id}`, name: connection.name, role: "integration" },
      {
        action: "settings.spend_ingested",
        entityType: "settings",
        entityId: connection.id,
        summary: `${connection.name} pushed ${recorded.length} spend ${recorded.length === 1 ? "entry" : "entries"}`,
        metadata: { recorded: recorded.length, failed: errors.length },
      },
    );
  }

  if (recorded.length === 0) {
    return NextResponse.json({ ok: false, recorded: 0, errors }, { status: 400 });
  }
  return NextResponse.json({ ok: true, recorded: recorded.length, entries: recorded, errors });
}
