import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { hasAdPlatformParent, listCampaignCategories } from "@/lib/campaigns";
import {
  getMetaConfig,
  type MetaSyncConfig,
  saveMetaConfig,
  syncMetaSpend,
} from "@/lib/meta-spend";
import { getTrimmedString } from "@/lib/validation";

export const runtime = "nodejs";

/** Client-safe view of the config — the access token never leaves the server. */
function toStatus(config: MetaSyncConfig) {
  return {
    enabled: config.enabled,
    adAccountId: config.adAccountId,
    source: config.source,
    hasToken: Boolean(config.accessToken),
    lastSyncedAt: config.lastSyncedAt,
    lastSyncError: config.lastSyncError,
  };
}

async function requireManageSpending() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  if (!hasPermission(session, "manage_spending")) {
    return {
      error: NextResponse.json(
        { error: "You do not have permission to manage spending." },
        { status: 403 },
      ),
    };
  }
  return { session };
}

export async function GET() {
  const { session, error } = await requireManageSpending();
  if (!session) return error;

  try {
    const config = await getMetaConfig();
    return NextResponse.json({ meta: toStatus(config) });
  } catch (err) {
    console.error("Failed to load Meta sync settings:", err);
    return NextResponse.json({ error: "Could not load Meta sync settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { session, error } = await requireManageSpending();
  if (!session) return error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const adAccountId = getTrimmedString(body, "adAccountId");
  const source = getTrimmedString(body, "source");
  const accessToken = getTrimmedString(body, "accessToken");
  const enabled = body.enabled === true;

  try {
    const current = await getMetaConfig();
    const next: MetaSyncConfig = {
      ...current,
      enabled,
      adAccountId,
      source,
      // Token is write-only: an empty field keeps the saved one.
      accessToken: accessToken || current.accessToken,
    };

    if (enabled) {
      if (!next.adAccountId || !next.accessToken) {
        return NextResponse.json(
          { error: "Ad account ID and access token are required to enable the sync." },
          { status: 400 },
        );
      }
      const categories = await listCampaignCategories();
      if (!hasAdPlatformParent(categories, next.source)) {
        return NextResponse.json(
          { error: "Choose a campaign group marked as a paid ad platform in Campaigns." },
          { status: 400 },
        );
      }
    }

    await saveMetaConfig(next, session.name || session.username);
    await recordAuditLog(session, {
      action: "settings.meta_sync_updated",
      entityType: "settings",
      entityId: "meta_spend_sync",
      summary: `Meta spend sync ${enabled ? "enabled" : "disabled"}`,
      metadata: { enabled, adAccountId, source, tokenReplaced: Boolean(accessToken) },
    });

    return NextResponse.json({ ok: true, meta: toStatus(next) });
  } catch (err) {
    console.error("Failed to save Meta sync settings:", err);
    return NextResponse.json({ error: "Could not save Meta sync settings." }, { status: 500 });
  }
}

export async function POST() {
  const { session, error } = await requireManageSpending();
  if (!session) return error;

  try {
    const config = await getMetaConfig();
    if (!config.enabled) {
      return NextResponse.json(
        { error: "Enable and save the Meta sync before running it." },
        { status: 400 },
      );
    }

    const result = await syncMetaSpend({ force: true });
    await recordAuditLog(session, {
      action: "settings.meta_sync_run",
      entityType: "settings",
      entityId: "meta_spend_sync",
      summary: `Ran Meta spend sync (${result.synced} days)`,
      metadata: { synced: result.synced, error: result.error ?? "" },
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({
      ok: true,
      synced: result.synced,
      meta: toStatus(await getMetaConfig()),
    });
  } catch (err) {
    console.error("Meta sync failed:", err);
    return NextResponse.json({ error: "Meta sync failed." }, { status: 500 });
  }
}
