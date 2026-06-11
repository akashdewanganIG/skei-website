import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { hasAdPlatformParent, listCampaignCategories } from "@/lib/campaigns";
import { db } from "@/lib/db";
import { type SpendConnectionRow, spendConnections } from "@/lib/db/schema";
import { generateIngestKey, hashIngestKey } from "@/lib/spend-automation";
import { getTrimmedString } from "@/lib/validation";

export const runtime = "nodejs";

/** Never expose the key hash to the client. */
function toSummary(row: SpendConnectionRow) {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    keyPrefix: row.keyPrefix,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
    lastUsedAt: row.lastUsedAt,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "manage_spending")) {
    return NextResponse.json(
      { error: "You do not have permission to manage spending." },
      { status: 403 },
    );
  }

  try {
    const rows = await db.select().from(spendConnections).orderBy(desc(spendConnections.createdAt));
    return NextResponse.json({ connections: rows.map(toSummary) });
  } catch (error) {
    console.error("Failed to load spend connections:", error);
    return NextResponse.json({ error: "Could not load connections." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "manage_spending")) {
    return NextResponse.json(
      { error: "You do not have permission to manage spending." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = getTrimmedString(body, "name");
  const source = getTrimmedString(body, "source");
  const categories = await listCampaignCategories();

  if (!name || !source) {
    return NextResponse.json(
      { error: "Connection name and campaign group are required." },
      { status: 400 },
    );
  }
  if (!hasAdPlatformParent(categories, source)) {
    return NextResponse.json(
      { error: "Choose a campaign group marked as a paid ad platform in Campaigns." },
      { status: 400 },
    );
  }

  try {
    const key = generateIngestKey();
    const [inserted] = await db
      .insert(spendConnections)
      .values({
        name,
        source,
        keyHash: hashIngestKey(key),
        keyPrefix: `${key.slice(0, 10)}…`,
        createdBy: session.name || session.username,
      })
      .returning();

    await recordAuditLog(session, {
      action: "settings.spend_connection_created",
      entityType: "settings",
      entityId: inserted.id,
      summary: `Created spend connection "${name}"`,
      metadata: { name, source },
    });

    // The plaintext key is returned exactly once; only its hash is stored.
    return NextResponse.json({ ok: true, connection: toSummary(inserted), key });
  } catch (error) {
    console.error("Failed to create spend connection:", error);
    return NextResponse.json({ error: "Could not create connection." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "manage_spending")) {
    return NextResponse.json(
      { error: "You do not have permission to manage spending." },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const [deleted] = await db
      .delete(spendConnections)
      .where(eq(spendConnections.id, id))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: "Connection not found." }, { status: 404 });
    }

    await recordAuditLog(session, {
      action: "settings.spend_connection_deleted",
      entityType: "settings",
      entityId: id,
      summary: `Revoked spend connection "${deleted.name}"`,
      metadata: { name: deleted.name, source: deleted.source },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete spend connection:", error);
    return NextResponse.json({ error: "Could not delete connection." }, { status: 500 });
  }
}
