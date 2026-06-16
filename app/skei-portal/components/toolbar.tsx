"use client";

import {
  RiCloseCircleLine,
  RiDownloadLine,
  RiRefreshLine,
  RiSearchLine,
  RiUploadLine,
  RiUserAddLine,
} from "@remixicon/react";
import { useMemo, useRef, useState } from "react";
import { Select } from "@/components/ui/select";
import type { CampaignSourceFilter } from "@/lib/campaign-attribution";
import { STATUS_FILTER_OPTIONS } from "../portal-constants";
import type { Filter, SelectOption } from "../portal-types";

type DurationMode = "all" | "custom";

const DURATION_OPTIONS: SelectOption<DurationMode>[] = [
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
];

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
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  showCampaignFilter,
  hasFilters,
  clearFilters,
  refreshing,
  refresh,
  addLead,
  exportCsv,
  importCsv,
  canAddLead,
  canExport,
  exportDisabled,
  canImport,
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
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  showCampaignFilter: boolean;
  hasFilters: boolean;
  clearFilters: () => void;
  refreshing: boolean;
  refresh: () => void;
  addLead?: () => void;
  exportCsv: () => void;
  importCsv?: (file: File) => void;
  canAddLead: boolean;
  canExport: boolean;
  exportDisabled: boolean;
  canImport: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [durationMode, setDurationMode] = useState<DurationMode>("all");
  const activeDurationMode: DurationMode = startDate || endDate ? "custom" : durationMode;
  const selectedDuration =
    DURATION_OPTIONS.find((option) => option.value === activeDurationMode) ?? DURATION_OPTIONS[0];

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
    <section className="mb-5 flex flex-col gap-3 border-b border-line pb-5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && importCsv) importCsv(file);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads, parents, phone, email..."
            className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-sm text-fg placeholder:text-muted/60 outline-none transition-colors focus:border-clay/50 focus:ring-2 focus:ring-clay/20"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="min-w-0 sm:w-[160px]">
            <Select
              instanceId="lead-duration-filter"
              options={DURATION_OPTIONS}
              value={selectedDuration}
              isSearchable={false}
              onChange={(option: unknown) => {
                const selected = option as SelectOption<DurationMode> | null;
                if (!selected) return;
                setDurationMode(selected.value);
                if (selected.value === "all") {
                  setStartDate("");
                  setEndDate("");
                }
              }}
            />
          </div>
          {activeDurationMode === "custom" && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-10 min-w-0 rounded-lg border border-line bg-surface px-3 text-sm text-fg outline-none transition-colors focus:border-clay/50 focus:ring-2 focus:ring-clay/20"
              />
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-10 min-w-0 rounded-lg border border-line bg-surface px-3 text-sm text-fg outline-none transition-colors focus:border-clay/50 focus:ring-2 focus:ring-clay/20"
              />
            </>
          )}
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg/75 transition-colors hover:bg-fg/[0.04] hover:text-fg sm:min-w-[8rem] sm:px-4"
        >
          <RiRefreshLine className={`h-4 w-4 shrink-0 ${refreshing ? "animate-spin" : ""}`} />
          <span className="truncate">Refresh</span>
        </button>
      </div>
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(140px,0.8fr)_minmax(140px,0.8fr)_minmax(180px,1fr)] xl:flex-1">
          <div className="min-w-0">
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
          <div className="min-w-0">
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
            <div className="min-w-0">
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
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
          {canAddLead && addLead && (
            <button
              type="button"
              onClick={addLead}
              className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg bg-clay px-3 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep sm:min-w-[9rem] sm:px-4"
            >
              <RiUserAddLine className="h-4 w-4 shrink-0" />
              <span className="truncate">Add lead</span>
            </button>
          )}
          {canImport && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg bg-clay px-3 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep sm:min-w-[9rem] sm:px-4"
            >
              <RiUploadLine className="h-4 w-4 shrink-0" />
              <span className="truncate">Import CSV</span>
            </button>
          )}
          {canExport && (
            <button
              type="button"
              onClick={exportCsv}
              disabled={exportDisabled}
              className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg bg-clay px-3 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[9rem] sm:px-4"
            >
              <RiDownloadLine className="h-4 w-4 shrink-0" />
              <span className="truncate">Export CSV</span>
            </button>
          )}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-clay/20 bg-clay/5 px-3 text-sm font-semibold text-clay transition-colors hover:bg-clay/10 sm:min-w-[8.5rem]"
            >
              <RiCloseCircleLine className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Clear</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
