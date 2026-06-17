import type { Lead } from "@/types/lead";

export type CampaignCategory = {
  id: string;
  name: string;
  color: string;
  subcategories: string[];
  utmTags: Record<string, string[]>;
  /** Paid ad platform — eligible for spend automation. */
  adPlatform: boolean;
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

// A search-engine referrer with no campaign tags is a free (organic) lead.
// It maps to a campaign group named "Organic …" when one exists, otherwise to
// this built-in bucket — never to a paid ad-platform group.
const ORGANIC_SEARCH_SOURCE: CampaignSource = {
  name: "Organic Search",
  parent: "Organic Search",
  color: "#2f8f5b",
  utmTags: [],
};

const SEARCH_ENGINE_HOST = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex|startpage)\./i;

function isSearchEngineReferrer(referrer: string): boolean {
  let host = referrer;
  try {
    host = new URL(referrer).hostname;
  } catch {
    // Not a parseable URL — test the raw value.
  }
  return SEARCH_ENGINE_HOST.test(host);
}

function organicSearchSource(categories?: readonly CampaignCategory[] | null): CampaignSource {
  const group = (categories ?? []).find((category) => /organic/i.test(category.name));
  if (!group) return ORGANIC_SEARCH_SOURCE;
  return { name: group.name, parent: group.name, color: group.color, utmTags: [] };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeKey(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  return (
    campaignSourcesFromCategories(categories).find((source) =>
      matchesCampaignValue(source, value),
    ) ?? null
  );
}

export function campaignSourcesFromCategories(
  categories?: readonly CampaignCategory[] | null,
): CampaignSource[] {
  return (categories ?? []).flatMap((category) => {
    const subcategories =
      category.subcategories.length > 0 ? category.subcategories : [category.name];
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
  // Most specific signal first: an explicit ?source= param, then the campaign
  // name, then platform-level values — so a source tagged with its campaign
  // name wins over a generic platform catch-all tag like "google".
  const campaignTags = [
    attribution.source,
    attribution.utmCampaign,
    attribution.utmSource,
    attribution.utmMedium,
    attribution.utmTerm,
    attribution.utmContent,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  for (const value of [...campaignTags, attribution.comment?.trim() ?? ""]) {
    if (!value) continue;
    const source = findCampaignSource(value, categories);
    if (source) return source;
  }

  // The referrer is used when the visit carried no campaign tags at all.
  // Search-engine referrers count as organic search; any other referrer
  // attributes to whichever group it matches — came from Instagram, counts
  // as Instagram.
  const referrer = attribution.referrer?.trim() ?? "";
  if (campaignTags.length === 0 && referrer) {
    if (isSearchEngineReferrer(referrer)) return organicSearchSource(categories);
    const referrerMatch = findCampaignSource(referrer, categories);
    if (referrerMatch) return referrerMatch;
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

  // An exact, stored source that matches a defined campaign is an intentional
  // signal — captured at submit time or set by an admin reassigning the lead —
  // so it outranks heuristic UTM/referrer matching below.
  if (savedSource && isCampaignSourceName(savedSource, categories)) {
    return sourceByName(savedSource, categories);
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

  return FALLBACK_SOURCE;
}
