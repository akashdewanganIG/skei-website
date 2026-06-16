"use client";

import {
  RiArrowUpLine,
  RiBarChartBoxLine,
  RiLineChartLine,
  RiPieChartLine,
  RiTeamLine,
} from "@remixicon/react";
import type { ComponentType } from "react";
import type { LeadAnalytics } from "@/lib/lead-analytics";
import type { Filter, LeadSection, View } from "../portal-types";
import { formatCurrency, pct } from "../portal-utils";
import { hexA } from "../status";
import {
  ChartCard,
  GradeDemand,
  MonthlyTrendChart,
  QualityChart,
  SourceCostChart,
  SourceQuality,
  StatusFunnel,
} from "./lead-charts";

// Mirrors qualityScore() in lib/lead-analytics.ts — update both together.
const QUALITY_SCORE_INFO =
  "Each lead is scored from a base of 28 points plus its pipeline stage (Admitted +42, Visit Scheduled +30, Contacted +18, New +8, Closed +2), with bonuses for an email (+8), a valid 10-digit mobile (+8), detailed notes (+7) and early-years grades (+5), capped at 8–98. High is 75+, Medium 50–74, Low below 50.";

export function OverviewView({
  analytics,
  setView,
  setStatusFilter,
  setLeadSection,
}: {
  analytics: LeadAnalytics;
  setView: (view: View) => void;
  setStatusFilter: (filter: Filter) => void;
  setLeadSection: (section: LeadSection) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total leads"
          value={analytics.total}
          detail={`${analytics.active} in active follow-up`}
          icon={RiTeamLine}
          color="#3f7cac"
          onClick={() => {
            setLeadSection("all");
            setStatusFilter("all");
            setView("leads");
          }}
        />
        <MetricCard
          title="Admitted"
          value={analytics.counts.Admitted}
          detail={`${pct(analytics.conversionRate)} conversion rate`}
          icon={RiArrowUpLine}
          color="#2f8f5b"
          onClick={() => {
            setLeadSection("enrolled");
            setView("leads");
          }}
        />
        <MetricCard
          title="Avg quality"
          value={pct(analytics.avgQuality)}
          detail="Lead quality score"
          icon={RiPieChartLine}
          color="#c2871b"
        />
        <MetricCard
          title="Avg CPL"
          value={formatCurrency(analytics.avgCpl)}
          detail={`${formatCurrency(analytics.totalSpend)} estimated spend`}
          icon={RiBarChartBoxLine}
          color="#b85c38"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr] [&>*:only-child]:col-span-full">
        <ChartCard title="Monthly lead trend" icon={RiLineChartLine}>
          <MonthlyTrendChart data={analytics.monthly} />
        </ChartCard>
        <ChartCard title="Pipeline split" icon={RiPieChartLine}>
          <StatusFunnel analytics={analytics} />
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3 [&>*:only-child]:col-span-full">
        <ChartCard title="Source spend" icon={RiBarChartBoxLine}>
          <SourceCostChart sources={analytics.sources} />
        </ChartCard>
        <ChartCard title="Lead quality score" icon={RiPieChartLine} info={QUALITY_SCORE_INFO}>
          <QualityChart buckets={analytics.qualityBuckets} avg={analytics.avgQuality} />
        </ChartCard>
        <ChartCard title="Top grade demand" icon={RiTeamLine}>
          <GradeDemand grades={analytics.grades} />
        </ChartCard>
      </section>
    </div>
  );
}

export function AnalyticsView({ analytics }: { analytics: LeadAnalytics }) {
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 [&>*:only-child]:col-span-full">
        <ChartCard title="Monthly lead trend" icon={RiLineChartLine}>
          <MonthlyTrendChart data={analytics.monthly} tall />
        </ChartCard>
        <ChartCard title="Source spend" icon={RiBarChartBoxLine}>
          <SourceCostChart sources={analytics.sources} />
        </ChartCard>
      </section>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3 [&>*:only-child]:col-span-full">
        <ChartCard title="Lead quality score" icon={RiPieChartLine} info={QUALITY_SCORE_INFO}>
          <QualityChart buckets={analytics.qualityBuckets} avg={analytics.avgQuality} />
        </ChartCard>
        <ChartCard title="Source quality" icon={RiBarChartBoxLine}>
          <SourceQuality sources={analytics.sources} />
        </ChartCard>
        <ChartCard title="Top grade demand" icon={RiTeamLine}>
          <GradeDemand grades={analytics.grades} />
        </ChartCard>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="rounded-lg border border-line bg-surface p-4 text-left shadow-soft transition-colors hover:border-fg/20"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</span>
        <span
          className="grid h-9 w-9 place-items-center rounded-lg"
          style={{ backgroundColor: hexA(color, 0.12), color }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 text-2xl font-semibold leading-none text-fg">{value}</div>
      <div className="mt-2 text-xs text-muted">{detail}</div>
    </Comp>
  );
}
