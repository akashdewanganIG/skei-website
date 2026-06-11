import { asc } from "drizzle-orm";
import type { CampaignCategory } from "@/lib/campaign-attribution";
import { db } from "./db";
import { leadCategories } from "./db/schema";

export async function listCampaignCategories(): Promise<CampaignCategory[]> {
  return db.select().from(leadCategories).orderBy(asc(leadCategories.name));
}

export function hasCampaignParent(
  categories: Pick<CampaignCategory, "name">[],
  value: string,
): boolean {
  const normalized = value.trim().toLowerCase();
  return categories.some((category) => category.name.trim().toLowerCase() === normalized);
}

/** Like hasCampaignParent, but only matches groups flagged as ad platforms. */
export function hasAdPlatformParent(
  categories: Pick<CampaignCategory, "name" | "adPlatform">[],
  value: string,
): boolean {
  return hasCampaignParent(
    categories.filter((category) => category.adPlatform),
    value,
  );
}
