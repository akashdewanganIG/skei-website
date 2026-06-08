import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { recordAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { hasCampaignParent, listCampaignCategories } from "@/lib/campaigns";
import { db } from "@/lib/db";
import { marketingSpends } from "@/lib/db/schema";
import { getTrimmedString } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (
    !hasPermission(session, "view_analytics") &&
    !hasPermission(session, "view_spending") &&
    !hasPermission(session, "manage_spending")
  ) {
    return NextResponse.json({ error: "You do not have permission to view spending." }, { status: 403 });
  }

  try {
    const rows = await db.select().from(marketingSpends).orderBy(desc(marketingSpends.date));
    return NextResponse.json({ spends: rows });
  } catch (error) {
    console.error("Failed to load marketing spends:", error);
    return NextResponse.json({ error: "Could not load marketing spends." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "manage_spending")) {
    return NextResponse.json({ error: "You do not have permission to manage spending." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const source = getTrimmedString(body, "source");
  const amount = Number(body.amount);
  const dateValue = getTrimmedString(body, "date");
  const date = new Date(dateValue);
  const categories = await listCampaignCategories();

  if (!source || !Number.isFinite(amount) || amount <= 0 || !dateValue || Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Campaign group, amount, and date are required." }, { status: 400 });
  }
  if (!hasCampaignParent(categories, source)) {
    return NextResponse.json({ error: "Choose a campaign group from Campaigns first." }, { status: 400 });
  }

  try {
    const inserted = await db
      .insert(marketingSpends)
      .values({
        source,
        amount: String(amount),
        date,
        addedBy: session.name || session.username,
      })
      .returning();

    await recordAuditLog(session, {
      action: "settings.spend_added",
      entityType: "settings",
      entityId: inserted[0].id,
      summary: `Added spend for ${source}`,
      metadata: { amount, source, date: dateValue },
    });

    return NextResponse.json({ ok: true, spend: inserted[0] });
  } catch (error) {
    console.error("Failed to insert marketing spend:", error);
    return NextResponse.json({ error: "Could not add spend." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "manage_spending")) {
    return NextResponse.json({ error: "You do not have permission to manage spending." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const [deleted] = await db.delete(marketingSpends).where(eq(marketingSpends.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: "Spend log not found." }, { status: 404 });
    }

    await recordAuditLog(session, {
      action: "settings.spend_deleted",
      entityType: "settings",
      entityId: id,
      summary: `Deleted spend for ${deleted.source}`,
      metadata: {
        source: deleted.source,
        amount: Number(deleted.amount),
        date: deleted.date.toISOString(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete marketing spend:", error);
    return NextResponse.json({ error: "Could not delete spend." }, { status: 500 });
  }
}
