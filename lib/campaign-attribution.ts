import type { Lead } from "@/types/lead";

export type CampaignCategory = {
  id: string;
  name: string;
  color: string;
  subcategories: string[];
  utmTags: Record<string, string[]>;
};

export type CampaignSource = {
  name: string;
  parent: string;
  color: string;
  utmTags: string[];
};

export type CampaignSourceName = string;
export type CampaignSourceFilter = "all" | string;

export type LeadAttribution = {
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  comment?: string;
};

const FALLBACK_SOURCE: CampaignSource = {
  name: "Unassigned",
  parent: "Unassigned",
  color: "#857a6b",
  utmTags: [],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeKey(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function compactKey(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g, "");
}

function matchesCampaignValue(source: CampaignSource, value: string): boolean {
  const valueKey = normalizeKey(value);
  if (!valueKey) return false;

  const campaignValues = [source.name, source.parent, ...source.utmTags];
  const normalizedValues = campaignValues.map((item) => normalizeKey(item)).filter(Boolean);
  if (normalizedValues.includes(valueKey)) return true;

  const valueCompact = compactKey(value);
  if (campaignValues.some((item) => valueCompact === compactKey(item))) return true;

  const valueText = ` ${valueKey} `;
  return normalizedValues.some((item) => valueText.includes(` ${item} `));
}

function findCampaignSource(
  value: string,
  categories?: readonly CampaignCategory[] | null,
): CampaignSource | null {
  return campaignSourcesFromCategories(categories).find((source) => matchesCampaignValue(source, value)) ?? null;
}

export function campaignSourcesFromCategories(
  categories?: readonly CampaignCategory[] | null,
): CampaignSource[] {
  return (categories ?? []).flatMap((category) => {
    const subcategories = category.subcategories.length > 0 ? category.subcategories : [category.name];
    return subcategories.map((subcategory) => ({
      name: subcategory,
      parent: category.name,
      color: category.color,
      utmTags: category.utmTags?.[subcategory] ?? [],
    }));
  });
}

export function campaignParentOptions(categories?: readonly CampaignCategory[] | null) {
  return (categories ?? []).map((category) => ({
    value: category.name,
    label: category.name,
  }));
}

export function campaignSourceOptions(categories?: readonly CampaignCategory[] | null) {
  return campaignSourcesFromCategories(categories).map((source) => ({
    value: source.name,
    label: source.name,
  }));
}

export function sourceByName(
  name: string,
  categories?: readonly CampaignCategory[] | null,
): CampaignSource {
  const normalized = normalize(name);
  return (
    campaignSourcesFromCategories(categories).find(
      (source) => normalize(source.name) === normalized || normalize(source.parent) === normalized,
    ) ?? FALLBACK_SOURCE
  );
}

export function inferSourceFromAttribution(
  attribution: LeadAttribution,
  categories?: readonly CampaignCategory[] | null,
): CampaignSource {
  const values = [
    attribution.source,
    attribution.utmSource,
    attribution.utmMedium,
    attribution.utmCampaign,
    attribution.utmTerm,
    attribution.utmContent,
    attribution.referrer,
    attribution.comment,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  for (const value of values) {
    const source = findCampaignSource(value, categories);
    if (source) return source;
  }

  return FALLBACK_SOURCE;
}

export function isCampaignSourceName(
  value: unknown,
  categories?: readonly CampaignCategory[] | null,
): value is string {
  return (
    typeof value === "string" &&
    campaignSourcesFromCategories(categories).some(
      (source) => normalize(source.name) === normalize(value),
    )
  );
}

export function isCampaignParentName(
  value: unknown,
  categories?: readonly CampaignCategory[] | null,
): value is string {
  return (
    typeof value === "string" &&
    (categories ?? []).some((category) => normalize(category.name) === normalize(value))
  );
}

export function inferCampaignSource(
  lead: Pick<
    Lead,
    | "id"
    | "mobile_no"
    | "comment"
    | "email"
    | "student_name"
    | "parent_name"
    | "source"
    | "utm_source"
    | "utm_medium"
    | "utm_campaign"
    | "utm_term"
    | "utm_content"
    | "referrer"
  >,
  categories?: readonly CampaignCategory[] | null,
): CampaignSource {
  const savedSource = lead.source.trim();
  const explicit = /(?:^|\n)\s*Campaign:\s*([^\n\r]+)/i.exec(lead.comment);
  if (explicit?.[1]) {
    const source = findCampaignSource(explicit[1], categories);
    if (source) return source;
  }

  const attributed = inferSourceFromAttribution(
    {
      utmSource: lead.utm_source,
      utmMedium: lead.utm_medium,
      utmCampaign: lead.utm_campaign,
      utmTerm: lead.utm_term,
      utmContent: lead.utm_content,
      referrer: lead.referrer,
      comment: lead.comment,
    },
    categories,
  );
  if (attributed.name !== FALLBACK_SOURCE.name) return attributed;

  if (savedSource && isCampaignSourceName(savedSource, categories)) {
    return sourceByName(savedSource, categories);
  }

  return FALLBACK_SOURCE;
}
