import {
  campaignSourcesFromCategories,
  inferCampaignSource,
  type CampaignCategory,
} from "@/lib/campaign-attribution";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/types/lead";

export type SpendLogInput = {
  source: string;
  amount: string | number;
  date: string | Date;
};

function parseLeadDate(value: string): Date | null {
  const [day, month, year] = value.split("-").map((part) => Number(part));
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", { month: "short" });
}

function qualityScore(lead: Lead): number {
  const statusBoost: Record<LeadStatus, number> = {
    New: 8,
    Contacted: 18,
    "Visit Scheduled": 30,
    Admitted: 42,
    Closed: 2,
  };
  let score = 28 + statusBoost[lead.status];
  if (lead.email) score += 8;
  if (/^\d{10}$/.test(lead.mobile_no.replace(/\D/g, ""))) score += 8;
  if (lead.comment.trim().length > 25) score += 7;
  if (/nursery|grade 1|grade 2|grade 3/i.test(lead.grade)) score += 5;
  return Math.max(8, Math.min(98, score));
}

export function buildMonthSeries(leads: Lead[]) {
  const dates = leads.map((lead) => parseLeadDate(lead.submit_date)).filter(Boolean) as Date[];
  const end = dates.length
    ? new Date(Math.max(...dates.map((date) => date.getTime())))
    : new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(end.getFullYear(), end.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: monthLabel(date),
      count: 0,
      admitted: 0,
    };
  });

  for (const lead of leads) {
    const date = parseLeadDate(lead.submit_date);
    if (!date) continue;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const item = months.find((month) => month.key === key);
    if (!item) continue;
    item.count += 1;
    if (lead.status === "Admitted") item.admitted += 1;
  }
  return months;
}

export function analyzeLeads(
  leads: Lead[],
  spendLogs: SpendLogInput[] = [],
  categories: CampaignCategory[] = [],
) {
  const campaignSources = campaignSourcesFromCategories(categories);
  const total = leads.length;
  const counts = { total } as Record<"total" | LeadStatus, number>;
  for (const status of LEAD_STATUSES) counts[status] = 0;

  const sourceMap = new Map<
    string,
    {
      name: string;
      parent: string;
      color: string;
      cost: number;
      leads: number;
      spend: number;
      quality: number;
    }
  >();
  const parentSpendMap = new Map<string, number>();
  const parentLeadsMap = new Map<string, number>();
  const gradeMap = new Map<string, number>();
  let totalQuality = 0;

  for (const source of campaignSources) {
    sourceMap.set(source.name, {
      name: source.name,
      parent: source.parent,
      color: source.color,
      cost: 0,
      leads: 0,
      spend: 0,
      quality: 0,
    });
  }

  for (const log of spendLogs) {
    const amount = Number(log.amount) || 0;
    parentSpendMap.set(log.source, (parentSpendMap.get(log.source) ?? 0) + amount);
  }

  for (const lead of leads) {
    counts[lead.status] += 1;
    const source = inferCampaignSource(lead, categories);
    const score = qualityScore(lead);

    let bucket = sourceMap.get(source.name);
    if (!bucket) {
      bucket = {
        name: source.name,
        parent: source.parent,
        color: source.color,
        cost: 0,
        leads: 0,
        spend: 0,
        quality: 0,
      };
      sourceMap.set(source.name, bucket);
    }

    bucket.leads += 1;
    bucket.quality += score;
    parentLeadsMap.set(source.parent, (parentLeadsMap.get(source.parent) ?? 0) + 1);

    if (lead.grade) gradeMap.set(lead.grade, (gradeMap.get(lead.grade) ?? 0) + 1);
    totalQuality += score;
  }

  for (const bucket of sourceMap.values()) {
    if (bucket.leads === 0) continue;
    const parentSpend = parentSpendMap.get(bucket.parent) ?? 0;
    const parentLeads = parentLeadsMap.get(bucket.parent) ?? 0;
    bucket.spend = parentLeads > 0 ? parentSpend * (bucket.leads / parentLeads) : 0;
  }

  const sources = Array.from(sourceMap.values()).map((source) => ({
    ...source,
    cpl: source.leads ? source.spend / source.leads : 0,
    avgQuality: source.leads ? source.quality / source.leads : 0,
  }));
  const totalSpend = spendLogs.reduce((sum, log) => sum + (Number(log.amount) || 0), 0);
  const avgQuality = total ? totalQuality / total : 0;
  const conversionRate = total ? (counts.Admitted / total) * 100 : 0;

  const qualityBuckets = [
    {
      label: "High",
      value: leads.filter((lead) => qualityScore(lead) >= 75).length,
      color: "#2f8f5b",
    },
    {
      label: "Medium",
      value: leads.filter((lead) => qualityScore(lead) >= 50 && qualityScore(lead) < 75).length,
      color: "#c2871b",
    },
    {
      label: "Low",
      value: leads.filter((lead) => qualityScore(lead) < 50).length,
      color: "#857a6b",
    },
  ];

  return {
    counts,
    total,
    active: counts.Contacted + counts["Visit Scheduled"],
    conversionRate,
    avgQuality,
    avgCpl: total ? totalSpend / total : 0,
    totalSpend,
    monthly: buildMonthSeries(leads),
    sources,
    qualityBuckets,
    grades: Array.from(gradeMap.entries())
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7),
  };
}

export type LeadAnalytics = ReturnType<typeof analyzeLeads>;
