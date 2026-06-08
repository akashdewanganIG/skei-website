import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { listCampaignCategories } from "@/lib/campaigns";
import { db } from "@/lib/db";
import { leadCategories } from "@/lib/db/schema";
import { getTrimmedString } from "@/lib/validation";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

function canReadCampaignData(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  return (
    hasPermission(session, "view_analytics") ||
    hasPermission(session, "view_leads") ||
    hasPermission(session, "edit_leads") ||
    hasPermission(session, "view_campaigns") ||
    hasPermission(session, "manage_campaigns") ||
    hasPermission(session, "view_spending") ||
    hasPermission(session, "manage_spending")
  );
}

function cleanSubcategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function cleanUtmTags(value: unknown, validKeys: string[]): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const valid = new Set(validKeys.map((key) => key.trim()).filter(Boolean));
  const tags: Record<string, string[]> = {};

  for (const key of valid) {
    const raw = input[key];
    if (!Array.isArray(raw)) continue;
    const cleaned = Array.from(
      new Set(
        raw
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
    if (cleaned.length > 0) tags[key] = cleaned;
  }

  return tags;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!canReadCampaignData(session)) {
    return NextResponse.json({ error: "You do not have permission to view campaigns." }, { status: 403 });
  }

  try {
    const rows = await listCampaignCategories();
    return NextResponse.json({ categories: rows });
  } catch (error) {
    console.error("Failed to load categories:", error);
    return NextResponse.json({ error: "Could not load categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "manage_campaigns")) {
    return NextResponse.json({ error: "You do not have permission to manage campaigns." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = getTrimmedString(body, "name");
    const subcategories = cleanSubcategories(body.subcategories);
    if (!name) {
      return NextResponse.json({ error: "Campaign group is required." }, { status: 400 });
    }
    const tagTargets = subcategories.length > 0 ? subcategories : [name];
    const utmTags = cleanUtmTags(body.utmTags, tagTargets);

    const inserted = await db
      .insert(leadCategories)
      .values({
        name,
        color: getTrimmedString(body, "color") || "#d9481e",
        subcategories,
        utmTags,
      })
      .returning();

    await recordAuditLog(session, {
      action: "settings.category_added",
      entityType: "settings",
      entityId: inserted[0].id,
      summary: `Added campaign group ${name}`,
      metadata: { subcategories, utmTags },
    });

    return NextResponse.json({ ok: true, category: inserted[0] });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "A campaign group with this name already exists." }, { status: 409 });
    }
    console.error("Failed to add campaign category:", error);
    return NextResponse.json({ error: "Could not add campaign group." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "manage_campaigns")) {
    return NextResponse.json({ error: "You do not have permission to manage campaigns." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = getTrimmedString(body, "id");
    const name = getTrimmedString(body, "name");
    const subcategories = cleanSubcategories(body.subcategories);
    if (!id || !name) {
      return NextResponse.json({ error: "Campaign group and ID are required." }, { status: 400 });
    }
    const tagTargets = subcategories.length > 0 ? subcategories : [name];
    const utmTags = cleanUtmTags(body.utmTags, tagTargets);

    const updated = await db
      .update(leadCategories)
      .set({
        name,
        color: getTrimmedString(body, "color") || "#d9481e",
        subcategories,
        utmTags,
      })
      .where(eq(leadCategories.id, id))
      .returning();

    await recordAuditLog(session, {
      action: "settings.category_updated",
      entityType: "settings",
      entityId: id,
      summary: `Updated campaign group ${name}`,
      metadata: { subcategories, utmTags },
    });

    return NextResponse.json({ ok: true, category: updated[0] });
  } catch (error) {
    console.error("Failed to update campaign category:", error);
    return NextResponse.json({ error: "Could not update campaign group." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasPermission(session, "manage_campaigns")) {
    return NextResponse.json({ error: "You do not have permission to manage campaigns." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const [deleted] = await db.delete(leadCategories).where(eq(leadCategories.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: "Campaign group not found." }, { status: 404 });
    }

    await recordAuditLog(session, {
      action: "settings.category_deleted",
      entityType: "settings",
      entityId: id,
      summary: `Deleted campaign group ${deleted.name}`,
      metadata: {
        name: deleted.name,
        campaignSources: deleted.subcategories,
        utmTags: deleted.utmTags,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete campaign category:", error);
    return NextResponse.json({ error: "Could not delete campaign group." }, { status: 500 });
  }
}
