"use client";

import type { ComponentType, ReactNode } from "react";
import { Fragment, useEffect, useState } from "react";
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
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LeadAnalytics } from "@/lib/lead-analytics";
import { LEAD_STATUSES } from "@/types/lead";
import { ORANGE_ACCENT } from "../portal-constants";
import { formatCurrency, pct } from "../portal-utils";
import { hexA, STATUS_META } from "../status";
import { EmptyInline } from "./empty-states";

// Theme-aware hover highlight for bar charts: a faint wash of the foreground
// colour, so it stays subtle in both light and dark mode (the Recharts default
// grey reads too dark on ivory and too light on the dark surface).
export const BAR_CURSOR = { fill: "color-mix(in srgb, var(--color-fg) 7%, transparent)" };

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

// Diagonal woven fills, one pattern per colour: a bold gradient stripe paired
// with a faint companion stripe over a soft tinted ground, so each shape reads
// as its source colour with a bit of depth. The pattern slowly drifts along its
// diagonal (disabled under prefers-reduced-motion).
const STRIPE_TILE = 10;
const stripeId = (prefix: string, color: string) => `${prefix}-${color.replace("#", "")}`;
export const stripeFill = (prefix: string, color: string) => `url(#${stripeId(prefix, color)})`;

export function StripeDefs({ prefix, colors }: { prefix: string; colors: string[] }) {
  const reduced = usePrefersReducedMotion();
  const unique = Array.from(new Set(colors));
  return (
    <defs>
      {unique.map((color) => {
        const id = stripeId(prefix, color);
        return (
          <Fragment key={id}>
            <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.6} />
            </linearGradient>
            <pattern
              id={id}
              patternUnits="userSpaceOnUse"
              width={STRIPE_TILE}
              height={STRIPE_TILE}
              patternTransform="rotate(45)"
            >
              <rect width={STRIPE_TILE} height={STRIPE_TILE} fill={hexA(color, 0.13)} />
              <rect width={3} height={STRIPE_TILE} fill={`url(#${id}-sheen)`} />
              <rect x={5.5} width={1.5} height={STRIPE_TILE} fill={hexA(color, 0.4)} />
              {!reduced && (
                <animateTransform
                  attributeName="patternTransform"
                  type="translate"
                  from="0 0"
                  to={`${STRIPE_TILE} 0`}
                  dur="5s"
                  repeatCount="indefinite"
                  additive="sum"
                />
              )}
            </pattern>
          </Fragment>
        );
      })}
    </defs>
  );
}

// Pie hover states (v3 syncs these to the tooltip-active slice automatically):
// the hovered slice keeps its size while the rest dim, so focus reads clearly
// without the pie resizing. All fields are optional so the renderer stays
// assignable to Recharts' richer PieSectorDataItem; we default geometry first.
type SliceShape = {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
};

function activeSlice({
  cx = 0,
  cy = 0,
  innerRadius = 0,
  outerRadius = 0,
  startAngle = 0,
  endAngle = 0,
  fill,
}: SliceShape) {
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="var(--color-surface)"
      strokeWidth={2}
    />
  );
}

function inactiveSlice({
  cx = 0,
  cy = 0,
  innerRadius = 0,
  outerRadius = 0,
  startAngle = 0,
  endAngle = 0,
  fill,
}: SliceShape) {
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="var(--color-surface)"
      strokeWidth={2}
      opacity={0.4}
    />
  );
}

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
  const topDomain = tall
    ? Math.max(6, maxLeads + Math.ceil(maxLeads * 0.25))
    : Math.max(4, maxLeads);
  const tickCount = topDomain < 12 ? topDomain + 1 : 5;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`w-full flex-1 ${tall ? "min-h-[280px]" : "min-h-[200px]"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <StripeDefs prefix="stripe-trend" colors={["#3f7cac", "#2f8f5b"]} />
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
              fill={stripeFill("stripe-trend", "#3f7cac")}
              fillOpacity={1}
              activeDot={{ r: 5, strokeWidth: 0, fill: "#3f7cac" }}
              animationDuration={1100}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="Admitted"
              stroke="#2f8f5b"
              strokeWidth={2}
              fill={stripeFill("stripe-trend", "#2f8f5b")}
              fillOpacity={1}
              activeDot={{ r: 4, strokeWidth: 0, fill: "#2f8f5b" }}
              animationDuration={1100}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        className="mt-3 shrink-0 pl-1"
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
  return (
    <div className="h-full min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <StripeDefs prefix="stripe-cost" colors={chartData.map((d) => d.color)} />
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
            cursor={BAR_CURSOR}
          />
          <Bar dataKey="cpl" maxBarSize={26} animationDuration={900} animationEasing="ease-out">
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={stripeFill("stripe-cost", entry.color)} />
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
  const total = buckets.reduce((sum, b) => sum + b.value, 0);
  return (
    <div className="flex h-full min-h-[200px] flex-col gap-5">
      <div className="mx-auto h-[210px] w-[210px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <StripeDefs prefix="stripe-quality-pie" colors={buckets.map((b) => b.color)} />
            <Tooltip content={<ChartTooltip />} />
            <Pie
              data={buckets}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius="92%"
              paddingAngle={1.5}
              stroke="var(--color-surface)"
              strokeWidth={2}
              activeShape={activeSlice}
              inactiveShape={inactiveSlice}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {buckets.map((bucket) => (
                <Cell key={bucket.label} fill={stripeFill("stripe-quality-pie", bucket.color)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3 border-t border-line pt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold leading-none text-fg">{pct(avg)}</span>
          <span className="text-xs text-muted">avg score</span>
        </div>
        <ul className="space-y-2">
          {buckets.map((bucket) => {
            const share = total ? Math.round((bucket.value / total) * 100) : 0;
            return (
              <li key={bucket.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-fg">
                  <span
                    className="h-2.5 w-2.5 rounded-[3px]"
                    style={{ backgroundColor: bucket.color }}
                  />
                  {bucket.label}
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold text-fg">{share}%</span>
                  <span className="ml-1.5 text-muted">{bucket.value}</span>
                </span>
              </li>
            );
          })}
        </ul>
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
    <div className="h-full min-h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <StripeDefs prefix="stripe-status" colors={chartData.map((d) => d.color)} />
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
            cursor={BAR_CURSOR}
          />
          <Bar dataKey="value" maxBarSize={22} animationDuration={900} animationEasing="ease-out">
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={stripeFill("stripe-status", entry.color)} />
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
  return (
    <div className="h-full min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <StripeDefs prefix="stripe-quality" colors={chartData.map((d) => d.color)} />
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
            cursor={BAR_CURSOR}
          />
          <Bar dataKey="quality" maxBarSize={26} animationDuration={900} animationEasing="ease-out">
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={stripeFill("stripe-quality", entry.color)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GradeDemand({ grades }: { grades: LeadAnalytics["grades"] }) {
  if (grades.length === 0) return <EmptyInline text="No grade data yet." />;
  return (
    <div className="h-full min-h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={grades}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <StripeDefs prefix="stripe-grade" colors={[ORANGE_ACCENT]} />
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
          <Tooltip content={<ChartTooltip />} cursor={BAR_CURSOR} />
          <Bar
            dataKey="count"
            name="Leads"
            fill={stripeFill("stripe-grade", ORANGE_ACCENT)}
            maxBarSize={26}
            animationDuration={900}
            animationEasing="ease-out"
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
