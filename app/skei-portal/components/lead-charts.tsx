"use client";

import type { ComponentType, ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LeadAnalytics } from "@/lib/lead-analytics";
import { LEAD_STATUSES } from "@/types/lead";
import { ORANGE_ACCENT } from "../portal-constants";
import { formatCurrency, pct } from "../portal-utils";
import { STATUS_META } from "../status";
import { EmptyInline } from "./empty-states";

export function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="flex h-full flex-col rounded-lg border border-line bg-surface shadow-soft">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        <Icon className="h-4 w-4 text-muted" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">{children}</div>
    </section>
  );
}

type TooltipItem = {
  name?: string | number;
  value?: string | number;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: TooltipItem[];
};

function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 max-w-[260px] rounded-lg border border-line bg-surface/95 px-3 py-2 text-xs shadow-lift backdrop-blur">
      {label !== undefined && <div className="mb-1 font-semibold text-fg">{label}</div>}
      <div className="space-y-1">
        {payload.map((item) => (
          <div
            key={`${item.dataKey ?? item.name}`}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-muted">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color ?? ORANGE_ACCENT }}
              />
              <span className="break-words">{item.name}</span>
            </span>
            <span className="font-semibold tabular-nums text-fg">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthlyTrendChart({
  data,
  tall = false,
}: {
  data: LeadAnalytics["monthly"];
  tall?: boolean;
}) {
  const chartData = data.map((item) => ({
    month: item.label,
    Leads: item.count,
    Admitted: item.admitted,
  }));
  const maxLeads = Math.max(0, ...chartData.map((d) => d.Leads));
  const topDomain = tall ? Math.max(6, maxLeads + Math.ceil(maxLeads * 0.25)) : Math.max(4, maxLeads);
  const tickCount = topDomain < 12 ? topDomain + 1 : 5;

  return (
    <div className="flex h-full flex-col">
      <div className={tall ? "min-h-[300px] flex-1" : "h-[230px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 18, right: 26, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3f7cac" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#3f7cac" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="admittedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2f8f5b" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2f8f5b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={34}
              domain={[0, topDomain]}
              tickCount={tickCount}
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: ORANGE_ACCENT, strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="Leads"
              stroke="#3f7cac"
              strokeWidth={2.5}
              fill="url(#leadFill)"
              activeDot={{ r: 5, strokeWidth: 0, fill: "#3f7cac" }}
            />
            <Area
              type="monotone"
              dataKey="Admitted"
              stroke="#2f8f5b"
              strokeWidth={2}
              fill="url(#admittedFill)"
              activeDot={{ r: 4, strokeWidth: 0, fill: "#2f8f5b" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        className={`ml-[16px] ${tall ? "mt-2" : "mt-4"}`}
        items={[
          { label: "Leads", color: "#3f7cac" },
          { label: "Admitted", color: "#2f8f5b" },
        ]}
      />
    </div>
  );
}

export function SourceCostChart({ sources }: { sources: LeadAnalytics["sources"] }) {
  const chartData = sources
    .slice()
    .sort((a, b) => b.leads - a.leads || b.cpl - a.cpl)
    .map((source) => ({
      name: source.name,
      cpl: Math.round(source.cpl),
      leads: source.leads,
      color: source.color,
    }));
  const chartHeight = Math.max(330, chartData.length * 34 + 58);
  return (
    <div className="min-h-[330px]" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 40, left: 18, bottom: 12 }}
        >
          <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatCurrency(Number(value)).replace(".00", "")}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={120}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0]?.payload as { leads?: number } | undefined;
              return (
                <ChartTooltip
                  active={active}
                  label={label}
                  payload={[
                    {
                      name: `${item?.leads ?? 0} leads`,
                      value: formatCurrency(Number(payload[0].value ?? 0)),
                      color: String(payload[0].payload.color),
                    },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="cpl" radius={[0, 8, 8, 0]} barSize={18}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QualityChart({
  buckets,
  avg,
}: {
  buckets: LeadAnalytics["qualityBuckets"];
  avg: number;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[150px_1fr]">
      <div className="relative h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip />} />
            <Pie
              data={buckets}
              dataKey="value"
              nameKey="label"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={4}
              stroke="var(--color-surface)"
              strokeWidth={4}
            >
              {buckets.map((bucket) => (
                <Cell key={bucket.label} fill={bucket.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-xl font-semibold leading-none text-fg">{pct(avg)}</div>
            <div className="mt-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted">
              avg
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bucket.color }} />
              {bucket.label}
            </span>
            <span className="font-semibold text-fg">{bucket.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusFunnel({ analytics }: { analytics: LeadAnalytics }) {
  const chartData = LEAD_STATUSES.map((status) => {
    const value = analytics.counts[status];
    return {
      status,
      value,
      share: analytics.total ? Math.round((value / analytics.total) * 100) : 0,
      color: STATUS_META[status].color,
    };
  });
  return (
    <div className="h-[270px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 34, left: 16, bottom: 10 }}
        >
          <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, Math.max(1, analytics.total)]}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="status"
            axisLine={false}
            tickLine={false}
            width={118}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload as { share?: number; color?: string } | undefined;
              return (
                <ChartTooltip
                  active={active}
                  label={label}
                  payload={[
                    {
                      name: "Leads",
                      value: `${payload[0].value ?? 0} / ${row?.share ?? 0}%`,
                      color: row?.color,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SourceQuality({ sources }: { sources: LeadAnalytics["sources"] }) {
  const chartData = sources
    .slice()
    .sort((a, b) => b.avgQuality - a.avgQuality)
    .map((source) => ({
      name: source.name,
      quality: Math.round(source.avgQuality),
      color: source.color,
    }));
  const chartHeight = Math.max(330, chartData.length * 34 + 58);
  return (
    <div className="min-h-[330px]" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 40, left: 18, bottom: 12 }}
        >
          <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload as { color?: string } | undefined;
              return (
                <ChartTooltip
                  active={active}
                  label={label}
                  payload={[
                    { name: "Quality", value: `${payload[0].value ?? 0}%`, color: row?.color },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="quality" radius={[0, 8, 8, 0]} barSize={18}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GradeDemand({ grades }: { grades: LeadAnalytics["grades"] }) {
  if (grades.length === 0) return <EmptyInline text="No grade data yet." />;
  const chartHeight = Math.max(270, grades.length * 34 + 58);
  return (
    <div className="min-h-[270px]" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={grades}
          layout="vertical"
          margin={{ top: 10, right: 34, left: 16, bottom: 12 }}
        >
          <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="grade"
            width={134}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar
            dataKey="count"
            name="Leads"
            fill={ORANGE_ACCENT}
            radius={[0, 8, 8, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartLegend({
  items,
  className = "mt-3",
}: {
  items: { label: string; color: string }[];
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-3 text-xs text-muted ${className}`}>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
