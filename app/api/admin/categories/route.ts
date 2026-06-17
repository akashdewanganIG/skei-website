import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { listCampaignCategories } from "@/lib/campaigns";
import { db } from "@/lib/db";
import {
  appSettings,
  leadCategories,
  leads,
  marketingSpends,
  spendConnections,
} from "@/lib/db/schema";
import { getTrimmedString } from "@/lib/validation";

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

function namesMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!canReadCampaignData(session)) {
    return NextResponse.json(
      { error: "You do not have permission to view campaigns." },
      { status: 403 },
    );
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
    return NextResponse.json(
      { error: "You do not have permission to manage campaigns." },
      { status: 403 },
    );
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
        adPlatform: body.adPlatform === true,
      })
      .returning();

    await recordAuditLog(session, {
      action: "settings.category_added",
      entityType: "settings",
      entityId: inserted[0].id,
      summary: `Added campaign group ${name}`,
      metadata: { subcategories, utmTags, adPlatform: body.adPlatform === true },
    });

    return NextResponse.json({ ok: true, category: inserted[0] });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json(
        { error: "A campaign group with this name already exists." },
        { status: 409 },
      );
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
    return NextResponse.json(
      { error: "You do not have permission to manage campaigns." },
      { status: 403 },
    );
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

    const { previousName, updated } = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(leadCategories)
        .where(eq(leadCategories.id, id))
        .limit(1);

      if (!current) return { previousName: "", updated: null };

      const [saved] = await tx
        .update(leadCategories)
        .set({
          name,
          color: getTrimmedString(body, "color") || "#d9481e",
          subcategories,
          utmTags,
          adPlatform: body.adPlatform === true,
        })
        .where(eq(leadCategories.id, id))
        .returning();

      if (current.name !== name) {
        await tx
          .update(marketingSpends)
          .set({ source: name })
          .where(eq(marketingSpends.source, current.name));

        await tx
          .update(spendConnections)
          .set({ source: name })
          .where(eq(spendConnections.source, current.name));

        const [metaSetting] = await tx
          .select()
          .from(appSettings)
          .where(eq(appSettings.key, "meta_spend_sync"))
          .limit(1);
        const metaConfig = metaSetting?.value;
        if (
          metaConfig &&
          typeof metaConfig === "object" &&
          !Array.isArray(metaConfig) &&
          typeof metaConfig.source === "string" &&
          namesMatch(metaConfig.source, current.name)
        ) {
          await tx
            .update(appSettings)
            .set({
              value: { ...metaConfig, source: name },
              updatedAt: new Date(),
              updatedBy: session.name || session.username,
            })
            .where(eq(appSettings.key, "meta_spend_sync"));
        }
      }

      return { previousName: current.name, updated: saved ?? null };
    });

    if (!updated) {
      return NextResponse.json({ error: "Campaign group not found." }, { status: 404 });
    }

    await recordAuditLog(session, {
      action: "settings.category_updated",
      entityType: "settings",
      entityId: id,
      summary: `Updated campaign group ${name}`,
      metadata: {
        previousName,
        subcategories,
        utmTags,
        adPlatform: body.adPlatform === true,
      },
    });

    return NextResponse.json({ ok: true, category: updated });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json(
        { error: "A campaign group with this name already exists." },
        { status: 409 },
      );
    }
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
    return NextResponse.json(
      { error: "You do not have permission to manage campaigns." },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // The client may ask to also delete the leads attributed to this group (it
    // computes which ones). Otherwise the leads simply fall back to "Unassigned".
    let deleteLeadIds: string[] = [];
    try {
      const body = (await request.json()) as { deleteLeadIds?: unknown };
      if (Array.isArray(body?.deleteLeadIds)) {
        deleteLeadIds = body.deleteLeadIds.filter(
          (value): value is string => typeof value === "string",
        );
      }
    } catch {
      // No body (or not JSON) — nothing extra to delete.
    }

    if (deleteLeadIds.length > 0 && !hasPermission(session, "delete_leads")) {
      return NextResponse.json(
        { error: "You do not have permission to delete leads." },
        { status: 403 },
      );
    }

    const { deleted, deletedLeads } = await db.transaction(async (tx) => {
      let removedLeads = 0;
      if (deleteLeadIds.length > 0) {
        const removed = await tx
          .delete(leads)
          .where(inArray(leads.id, deleteLeadIds))
          .returning({ id: leads.id });
        removedLeads = removed.length;
      }
      const [deletedRow] = await tx
        .delete(leadCategories)
        .where(eq(leadCategories.id, id))
        .returning();
      return { deleted: deletedRow ?? null, deletedLeads: removedLeads };
    });

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
        deletedLeads,
      },
    });

    return NextResponse.json({ ok: true, deletedLeads });
  } catch (error) {
    console.error("Failed to delete campaign category:", error);
    return NextResponse.json({ error: "Could not delete campaign group." }, { status: 500 });
  }
}
