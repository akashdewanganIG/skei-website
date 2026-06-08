"use client";

import { useId } from "react";
import { Select } from "@/components/ui/select";
import {
  inferCampaignSource,
  type CampaignCategory,
  type CampaignSourceName,
} from "@/lib/campaign-attribution";
import type { Lead, LeadStatus } from "@/types/lead";
import { LEAD_SECTIONS, LEAD_STATUS_OPTIONS, ORANGE_ACCENT } from "../portal-constants";
import type { LeadSection, SelectOption } from "../portal-types";
import { initials } from "../portal-utils";
import { hexA } from "../status";
import { EmptyState } from "./empty-states";

export function LeadsView({
  leads,
  allLeads,
  categories,
  leadSection,
  setLeadSection,
  onOpen,
  onStatusChange,
  canManageStatus,
}: {
  leads: Lead[];
  allLeads: Lead[];
  categories: CampaignCategory[];
  leadSection: LeadSection;
  setLeadSection: (section: LeadSection) => void;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  canManageStatus: boolean;
}) {
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {LEAD_SECTIONS.map((section) => {
          const count = section.statuses
            ? allLeads.filter((lead) => section.statuses?.includes(lead.status)).length
            : allLeads.length;
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => setLeadSection(section.key)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                leadSection === section.key
                  ? "border-clay/40 bg-clay/10"
                  : "border-line bg-surface hover:border-fg/20"
              }`}
            >
              <span className="block text-xs font-semibold text-muted">{section.label}</span>
              <span className="mt-2 block text-2xl font-semibold leading-none text-fg">
                {count}
              </span>
            </button>
          );
        })}
      </section>

      <section className="rounded-lg border border-line bg-surface shadow-soft">
        <div className="border-b border-line px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-fg">Lead pipeline</h2>
            <p className="mt-1 text-xs text-muted">
              Showing {leads.length} of {allLeads.length} leads
            </p>
          </div>
        </div>

        {leads.length === 0 ? (
          <EmptyState hasLeads={allLeads.length > 0} />
        ) : (
          <>
            <LeadTable
              leads={leads}
              categories={categories}
              onOpen={onOpen}
              onStatusChange={onStatusChange}
              canManageStatus={canManageStatus}
            />
            <LeadCards leads={leads} categories={categories} onOpen={onOpen} />
          </>
        )}
      </section>
    </div>
  );
}

function LeadTable({
  leads,
  categories,
  onOpen,
  onStatusChange,
  canManageStatus,
}: {
  leads: Lead[];
  categories: CampaignCategory[];
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  canManageStatus: boolean;
}) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[1040px] text-sm">
        <thead>
          <tr className="border-b border-line bg-bg/45 text-left text-[0.68rem] uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-semibold">Student</th>
            <th className="px-4 py-3 font-semibold">Campaign</th>
            <th className="px-4 py-3 font-semibold">Grade</th>
            <th className="px-4 py-3 font-semibold">Parent</th>
            <th className="px-4 py-3 font-semibold">Contact</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Remark</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const source = inferCampaignSource(lead, categories);
            return (
              <tr
                key={lead.id}
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest("[data-row-interactive]")) return;
                  onOpen(lead.id);
                }}
                className="cursor-pointer border-b border-line/70 transition-colors last:border-0 hover:bg-bg/55"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold"
                      style={{
                        color: ORANGE_ACCENT,
                        backgroundColor: hexA(ORANGE_ACCENT, 0.14),
                      }}
                    >
                      {initials(lead.student_name)}
                    </span>
                    <span className="font-medium text-fg">{lead.student_name || "Unnamed"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <CampaignBadge source={source.name} />
                </td>
                <td className="px-4 py-3 text-muted">{lead.grade || "-"}</td>
                <td className="px-4 py-3 text-muted">{lead.parent_name || "-"}</td>
                <td className="px-4 py-3">
                  <div className="text-fg">{lead.mobile_no || "-"}</div>
                  <div className="text-xs text-muted">{lead.email || "-"}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {lead.submit_date || "-"}
                </td>
                <td className="px-4 py-3" data-row-interactive="true">
                  {canManageStatus ? (
                    <StatusSelect
                      value={lead.status}
                      onChange={(status) => onStatusChange(lead.id, status)}
                    />
                  ) : (
                    <OrangeStatusBadge status={lead.status} />
                  )}
                </td>
                <td className="max-w-[18rem] px-4 py-3 text-muted">
                  <span className="line-clamp-2">{lead.remark || "-"}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
}) {
  const inputId = useId();
  const selected =
    LEAD_STATUS_OPTIONS.find((option) => option.value === value) ?? LEAD_STATUS_OPTIONS[0];
  return (
    <div className="min-w-[156px]">
      <Select
        instanceId={inputId}
        options={LEAD_STATUS_OPTIONS}
        value={selected}
        isSearchable={false}
        onChange={(option: unknown) => {
          const next = option as SelectOption<LeadStatus> | null;
          if (next) onChange(next.value);
        }}
      />
    </div>
  );
}

function OrangeStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold"
      style={{
        color: ORANGE_ACCENT,
        backgroundColor: hexA(ORANGE_ACCENT, 0.12),
        borderColor: hexA(ORANGE_ACCENT, 0.28),
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ORANGE_ACCENT }} />
      {status}
    </span>
  );
}

function CampaignBadge({ source }: { source: CampaignSourceName }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-md border border-line bg-bg/60 px-1.5 py-0.5 text-[0.65rem] uppercase text-fg">
      {source}
    </span>
  );
}

function LeadCards({
  leads,
  categories,
  onOpen,
}: {
  leads: Lead[];
  categories: CampaignCategory[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 p-4 lg:hidden">
      {leads.map((lead) => {
        const source = inferCampaignSource(lead, categories);
        return (
          <button
            key={lead.id}
            type="button"
            onClick={() => onOpen(lead.id)}
            className="rounded-lg border border-line bg-bg/35 p-4 text-left transition-colors hover:bg-bg/65"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold"
                  style={{ color: ORANGE_ACCENT, backgroundColor: hexA(ORANGE_ACCENT, 0.14) }}
                >
                  {initials(lead.student_name)}
                </span>
                <div>
                  <div className="font-medium text-fg">{lead.student_name || "Unnamed"}</div>
                  <div className="text-xs text-muted">
                    {lead.grade || "-"} / {lead.submit_date || "-"}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <OrangeStatusBadge status={lead.status} />
                <CampaignBadge source={source.name} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
              <span>{lead.parent_name || "-"}</span>
              <span className="font-medium text-fg">{lead.mobile_no || "-"}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
