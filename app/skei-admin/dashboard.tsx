"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  RiSearchLine,
  RiRefreshLine,
  RiDownloadLine,
  RiLogoutBoxRLine,
  RiUserStarLine,
  RiTeamLine,
  RiInboxLine,
  RiCloseCircleLine,
} from "@remixicon/react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Select } from "@/components/ui/select";
import { EASE } from "@/lib/animations";
import { LEAD_STATUSES, type Lead, type Session } from "@/types/lead";
import { BrandLogo } from "@/components/ui/logo";
import { STATUS_META, StatusBadge, hexA } from "./status";
import { LeadDetail } from "./lead-detail";

type Filter = "all" | (typeof LEAD_STATUSES)[number];

/** Two-letter monogram from a name, e.g. "Asha Rao" → "AR". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function toCsv(leads: Lead[]): string {
  const columns: (keyof Lead)[] = [
    "submit_date",
    "student_name",
    "grade",
    "dob",
    "gender",
    "parent_name",
    "mobile_no",
    "email",
    "comment",
    "status",
    "remark",
    "updated_by",
    "updated_at",
  ];
  const esc = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = columns.join(",");
  const rows = leads.map((lead) => columns.map((c) => esc(String(lead[c] ?? ""))).join(","));
  return [header, ...rows].join("\r\n");
}

export function Dashboard({
  session,
  initialLeads,
  loadError,
}: {
  session: Session;
  initialLeads: Lead[];
  loadError: string | null;
}) {
  const router = useRouter();
  const isAdmin = session.role === "admin";
  const greeting = useMemo(() => greetingFor(), []);
  const firstName = session.name.split(/\s+/)[0];

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Filter>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const gradeOptions = useMemo(() => {
    const grades = Array.from(new Set(leads.map((l) => l.grade).filter(Boolean))).sort();
    return [{ value: "all", label: "All grades" }, ...grades.map((g) => ({ value: g, label: g }))];
  }, [leads]);

  const counts = useMemo(() => {
    const base = { total: leads.length } as Record<string, number>;
    for (const status of LEAD_STATUSES) base[status] = 0;
    for (const lead of leads) base[lead.status] = (base[lead.status] ?? 0) + 1;
    return base;
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (gradeFilter !== "all" && lead.grade !== gradeFilter) return false;
      if (!q) return true;
      return [lead.student_name, lead.parent_name, lead.mobile_no, lead.email, lead.comment]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [leads, search, statusFilter, gradeFilter]);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  const hasFilters = search.trim() !== "" || statusFilter !== "all" || gradeFilter !== "all";

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setGradeFilter("all");
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLeads(data.leads as Lead[]);
    } catch {
      toast.error("Could not refresh leads.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const patchLead = useCallback(
    async (id: string, patch: Partial<Lead>) => {
      const previous = leads;
      setLeads((current) => current.map((l) => (l.id === id ? { ...l, ...patch } : l)));
      try {
        const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Update failed.");
        setLeads((current) => current.map((l) => (l.id === id ? (data.lead as Lead) : l)));
        toast.success("Saved.");
        return true;
      } catch (error) {
        setLeads(previous);
        toast.error(error instanceof Error ? error.message : "Update failed.");
        return false;
      }
    },
    [leads],
  );

  const removeLead = useCallback(
    async (id: string) => {
      const previous = leads;
      setLeads((current) => current.filter((l) => l.id !== id));
      setSelectedId(null);
      try {
        const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Delete failed.");
        toast.success("Lead deleted.");
      } catch (error) {
        setLeads(previous);
        toast.error(error instanceof Error ? error.message : "Delete failed.");
      }
    },
    [leads],
  );

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/skei-admin/login");
    router.refresh();
  }, [router]);

  const exportCsv = useCallback(() => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `skei-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="mx-auto min-h-dvh max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="sticky top-0 z-30 -mx-4 flex flex-wrap items-center justify-between gap-4 border-b border-line bg-bg/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <BrandLogo priority className="h-10 w-auto" />
          <div>
            <div className="font-display text-lg leading-none text-fg">Leads Dashboard</div>
            <div className="mt-1 text-xs text-muted">
              {greeting}, <span className="text-fg/80">{firstName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-2.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3 shadow-soft sm:flex">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-[0.7rem] font-bold ${
                isAdmin ? "bg-clay/12 text-clay" : "bg-fg/[0.07] text-muted"
              }`}
            >
              {initials(session.name)}
            </span>
            <span className="text-xs font-medium text-fg">{session.name}</span>
            <span className="flex items-center gap-1 rounded-full bg-clay/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-clay">
              {isAdmin ? (
                <RiUserStarLine className="h-3 w-3" />
              ) : (
                <RiTeamLine className="h-3 w-3" />
              )}
              {session.role}
            </span>
          </div>
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm text-fg/70 shadow-soft transition-colors hover:bg-fg/[0.06] hover:text-fg"
          >
            <RiLogoutBoxRLine className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          index={0}
          label="Total leads"
          value={counts.total}
          share={1}
          active={statusFilter === "all"}
          color="#d9481e"
          onClick={() => setStatusFilter("all")}
        />
        {LEAD_STATUSES.map((status, i) => (
          <StatCard
            key={status}
            index={i + 1}
            label={status}
            value={counts[status] ?? 0}
            share={counts.total ? (counts[status] ?? 0) / counts.total : 0}
            active={statusFilter === status}
            color={STATUS_META[status].color}
            onClick={() => setStatusFilter((s) => (s === status ? "all" : status))}
          />
        ))}
      </section>

      {/* Toolbar */}
      <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email…"
            className="w-full rounded-xl border border-fg/15 bg-surface py-2.5 pl-10 pr-3.5 text-sm text-fg placeholder:text-muted/60 transition-all focus:border-clay/50 focus:outline-none focus:ring-2 focus:ring-clay/25"
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            instanceId="grade-filter"
            options={gradeOptions}
            value={gradeOptions.find((o) => o.value === gradeFilter) ?? gradeOptions[0]}
            onChange={(opt) => setGradeFilter((opt as { value: string } | null)?.value ?? "all")}
          />
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex h-[42px] items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 text-sm text-fg/80 transition-colors hover:bg-fg/[0.04]"
        >
          <RiRefreshLine className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-clay px-3.5 text-sm font-medium text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RiDownloadLine className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        )}
      </section>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted">
        <span>
          Showing <span className="font-semibold text-fg">{filtered.length}</span> of {leads.length}{" "}
          leads
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-clay transition-colors hover:bg-clay/10"
          >
            <RiCloseCircleLine className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {loadError && (
        <div className="mt-4 rounded-xl border border-clay/30 bg-clay/[0.06] px-4 py-3 text-sm text-clay-deep">
          {loadError}. Check the leads service configuration, then Refresh.
        </div>
      )}

      {/* Table / cards */}
      {filtered.length === 0 ? (
        <EmptyState hasLeads={leads.length > 0} />
      ) : (
        <>
          <LeadTable
            leads={filtered}
            isAdmin={isAdmin}
            onOpen={setSelectedId}
            onStatusChange={(id, status) => patchLead(id, { status })}
          />
          <LeadCards leads={filtered} onOpen={setSelectedId} />
        </>
      )}

      <AnimatePresence>
        {selected && (
          <LeadDetail
            lead={selected}
            isAdmin={isAdmin}
            onClose={() => setSelectedId(null)}
            onPatch={patchLead}
            onDelete={removeLead}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  index,
  label,
  value,
  share,
  color,
  active,
  onClick,
}: {
  index: number;
  label: string;
  value: number;
  share: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const isTotal = label === "Total leads";
  const pct = Math.round(share * 100);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE, delay: index * 0.04 }}
      className="group relative overflow-hidden rounded-2xl border bg-surface p-3.5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
      style={{
        borderColor: active ? color : "var(--color-line)",
        backgroundColor: active ? hexA(color, 0.07) : undefined,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="truncate text-[0.7rem] font-medium capitalize text-muted">{label}</span>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-1">
        <span className="font-display text-[1.75rem] leading-none text-fg">{value}</span>
        {!isTotal && value > 0 && (
          <span className="text-[0.65rem] font-semibold tabular-nums text-muted">{pct}%</span>
        )}
      </div>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-fg/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(share * 100, value > 0 ? 6 : 0)}%`, backgroundColor: color }}
        />
      </div>
    </motion.button>
  );
}

function LeadTable({
  leads,
  isAdmin,
  onOpen,
  onStatusChange,
}: {
  leads: Lead[];
  isAdmin: boolean;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: Lead["status"]) => void;
}) {
  return (
    <div className="mt-4 hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-soft lg:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-bg/40 text-left text-[0.68rem] uppercase tracking-wider text-muted">
            <th className="px-4 py-3 font-semibold">Student</th>
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
            const { color } = STATUS_META[lead.status] ?? STATUS_META.New;
            return (
              <tr
                key={lead.id}
                onClick={() => onOpen(lead.id)}
                className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-bg/60"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold"
                      style={{ color, backgroundColor: hexA(color, 0.14) }}
                    >
                      {initials(lead.student_name)}
                    </span>
                    <span className="font-medium text-fg">{lead.student_name || "Unnamed"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{lead.grade || "—"}</td>
                <td className="px-4 py-3 text-muted">{lead.parent_name || "—"}</td>
                <td className="px-4 py-3">
                  <div className="text-fg">{lead.mobile_no || "—"}</div>
                  <div className="text-xs text-muted">{lead.email}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {lead.submit_date || "—"}
                </td>
                <td className="px-4 py-3">
                  {isAdmin ? (
                    <StatusSelect
                      value={lead.status}
                      onChange={(status) => onStatusChange(lead.id, status)}
                    />
                  ) : (
                    <StatusBadge status={lead.status} />
                  )}
                </td>
                <td className="max-w-[16rem] px-4 py-3 text-muted">
                  <span className="line-clamp-2">{lead.remark || "—"}</span>
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
  value: Lead["status"];
  onChange: (status: Lead["status"]) => void;
}) {
  const { color } = STATUS_META[value];
  return (
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as Lead["status"])}
      className="cursor-pointer rounded-full border bg-transparent px-2.5 py-1 text-[0.7rem] font-semibold outline-none transition-colors focus:ring-2 focus:ring-clay/25"
      style={{ color, borderColor: hexA(color, 0.4), backgroundColor: hexA(color, 0.1) }}
    >
      {LEAD_STATUSES.map((status) => (
        <option key={status} value={status} className="bg-surface text-fg">
          {status}
        </option>
      ))}
    </select>
  );
}

function LeadCards({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  return (
    <div className="mt-4 flex flex-col gap-3 lg:hidden">
      {leads.map((lead) => {
        const { color } = STATUS_META[lead.status] ?? STATUS_META.New;
        return (
          <button
            key={lead.id}
            type="button"
            onClick={() => onOpen(lead.id)}
            className="rounded-2xl border border-line bg-surface p-4 text-left shadow-soft transition-all active:scale-[0.99] hover:bg-bg/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold"
                  style={{ color, backgroundColor: hexA(color, 0.14) }}
                >
                  {initials(lead.student_name)}
                </span>
                <div>
                  <div className="font-medium text-fg">{lead.student_name || "Unnamed"}</div>
                  <div className="text-xs text-muted">
                    {lead.grade || "—"} · {lead.submit_date}
                  </div>
                </div>
              </div>
              <StatusBadge status={lead.status} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
              <span>{lead.parent_name || "—"}</span>
              <span className="font-medium text-fg">{lead.mobile_no}</span>
            </div>
            {lead.remark && (
              <div className="mt-2 line-clamp-2 rounded-lg bg-bg/60 px-2.5 py-1.5 text-xs text-muted">
                {lead.remark}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ hasLeads }: { hasLeads: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/60 py-16 text-center"
    >
      <RiInboxLine className="h-10 w-10 text-muted/50" />
      <p className="mt-3 text-sm font-medium text-fg">
        {hasLeads ? "No leads match your filters" : "No leads yet"}
      </p>
      <p className="mt-1 text-xs text-muted">
        {hasLeads ? "Try clearing the search or status filter." : "New enquiries will appear here."}
      </p>
    </motion.div>
  );
}
