"use client";

import {
  RiCloseCircleLine,
  RiDownloadLine,
  RiRefreshLine,
  RiSearchLine,
  RiUserAddLine,
} from "@remixicon/react";
import { useMemo } from "react";
import { Select } from "@/components/ui/select";
import type { CampaignSourceFilter } from "@/lib/campaign-attribution";
import { STATUS_FILTER_OPTIONS } from "../portal-constants";
import type { Filter, SelectOption } from "../portal-types";

export function Toolbar({
  search,
  setSearch,
  gradeFilter,
  setGradeFilter,
  gradeOptions,
  statusFilter,
  setStatusFilter,
  sourceFilter,
  setSourceFilter,
  sourceOptions,
  showCampaignFilter,
  hasFilters,
  clearFilters,
  refreshing,
  refresh,
  addLead,
  exportCsv,
  canAddLead,
  canExport,
  exportDisabled,
}: {
  search: string;
  setSearch: (value: string) => void;
  gradeFilter: string;
  setGradeFilter: (value: string) => void;
  gradeOptions: string[];
  statusFilter: Filter;
  setStatusFilter: (value: Filter) => void;
  sourceFilter: CampaignSourceFilter;
  setSourceFilter: (value: CampaignSourceFilter) => void;
  sourceOptions: SelectOption<CampaignSourceFilter>[];
  showCampaignFilter: boolean;
  hasFilters: boolean;
  clearFilters: () => void;
  refreshing: boolean;
  refresh: () => void;
  addLead?: () => void;
  exportCsv: () => void;
  canAddLead: boolean;
  canExport: boolean;
  exportDisabled: boolean;
}) {
  const statusSelectValue =
    STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter) ??
    STATUS_FILTER_OPTIONS[0];
  const gradeSelectOptions = useMemo<SelectOption<string>[]>(
    () =>
      gradeOptions.map((grade) => ({
        value: grade,
        label: grade === "all" ? "All grades" : grade,
      })),
    [gradeOptions],
  );
  const gradeSelectValue =
    gradeSelectOptions.find((option) => option.value === gradeFilter) ?? gradeSelectOptions[0];
  const sourceSelectValue =
    sourceOptions.find((option) => option.value === sourceFilter) ?? sourceOptions[0];

  return (
    <section className="mb-5 flex flex-col gap-2 border-b border-line pb-5">
      <div className="relative w-full">
        <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads, parents, phone, email..."
          className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-sm text-fg placeholder:text-muted/60 outline-none transition-colors focus:border-clay/50 focus:ring-2 focus:ring-clay/20"
        />
      </div>
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <div className="min-w-0 flex-1">
          <Select
            instanceId="lead-status-filter"
            options={STATUS_FILTER_OPTIONS}
            value={statusSelectValue}
            isSearchable={false}
            onChange={(option: unknown) => {
              const selected = option as SelectOption<Filter> | null;
              if (selected) setStatusFilter(selected.value);
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <Select
            instanceId="lead-grade-filter"
            options={gradeSelectOptions}
            value={gradeSelectValue}
            isSearchable={false}
            onChange={(option: unknown) => {
              const selected = option as SelectOption<string> | null;
              if (selected) setGradeFilter(selected.value);
            }}
          />
        </div>
        {showCampaignFilter && (
          <div className="min-w-0 flex-1">
            <Select
              instanceId="lead-campaign-filter"
              options={sourceOptions}
              value={sourceSelectValue}
              isSearchable={false}
              onChange={(option: unknown) => {
                const selected = option as SelectOption<CampaignSourceFilter> | null;
                if (selected) setSourceFilter(selected.value);
              }}
            />
          </div>
        )}
        {canAddLead && addLead && (
          <button
            type="button"
            onClick={addLead}
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep"
          >
            <RiUserAddLine className="h-4 w-4" />
            Add lead
          </button>
        )}
        <button
          type="button"
          onClick={refresh}
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg/75 transition-colors hover:bg-fg/[0.04] hover:text-fg"
        >
          <RiRefreshLine className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
        {canExport && (
          <button
            type="button"
            onClick={exportCsv}
            disabled={exportDisabled}
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RiDownloadLine className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-xs font-semibold text-clay hover:bg-clay/10 xl:self-auto"
        >
          <RiCloseCircleLine className="h-3.5 w-3.5" />
          Clear filters
        </button>
      )}
    </section>
  );
}
