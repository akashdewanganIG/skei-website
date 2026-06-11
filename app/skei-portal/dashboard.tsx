"use client";

import {
  RiBarChartBoxLine,
  RiDashboardLine,
  RiFileList3Line,
  RiLogoutBoxRLine,
  RiShieldCheckLine,
  RiTeamLine,
  RiUserLine,
  RiUserStarLine,
  RiWalletLine,
  RiPriceTag3Line,
} from "@remixicon/react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandLogo } from "@/components/ui/logo";
import { canManageUsers, hasPermission } from "@/lib/auth/permissions";
import { analyzeLeads } from "@/lib/lead-analytics";
import {
  campaignSourceOptions,
  inferCampaignSource,
  type CampaignSourceFilter,
} from "@/lib/campaign-attribution";
import type { Lead, Session } from "@/types/lead";
import { AccountView } from "./components/account-view";
import { AnalyticsView, OverviewView } from "./components/analytics-views";
import { CampaignsView } from "./components/campaigns-view";
import { LeadsView } from "./components/leads-view";
import { LogsView } from "./components/logs-view";
import { ImportCsvDialog } from "./components/import-csv-dialog";
import { ManualLeadDialog } from "./components/manual-lead-dialog";
import { MobileNavButton, type NavItem, SidebarButton } from "./components/navigation";
import { SpendingView } from "./components/spending-view";
import { Toolbar } from "./components/toolbar";
import { UsersView } from "./components/users-view";
import { LeadDetail } from "./lead-detail";
import { LEAD_SECTIONS } from "./portal-constants";
import type {
  CampaignCategory,
  Filter,
  LeadSection,
  ManualLeadDraft,
  SpendLog,
  View,
} from "./portal-types";
import { greetingFor, initials, parseCsv, toCsv } from "./portal-utils";

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
  const canViewLeads = hasPermission(session, "view_leads");
  const canViewAnalytics = hasPermission(session, "view_analytics");
  const canEditRemarks = hasPermission(session, "edit_remarks");
  const canEditDetails = hasPermission(session, "edit_leads");
  const canManageStatus = hasPermission(session, "manage_status");
  const canDeleteLeads = hasPermission(session, "delete_leads");
  const canExportLeads = hasPermission(session, "export_leads");
  const canUseUsers = canManageUsers(session);
  const canViewLogs = hasPermission(session, "view_logs");
  const canManageCampaigns = hasPermission(session, "manage_campaigns");
  const canViewCampaigns = canManageCampaigns || hasPermission(session, "view_campaigns");
  const canManageSpending = hasPermission(session, "manage_spending");
  const canViewSpending = canManageSpending || hasPermission(session, "view_spending");
  const canLoadMarketingData = canViewLeads || canViewAnalytics || canViewCampaigns || canViewSpending;

  const [view, setView] = useState<View>(canViewAnalytics ? "overview" : "leads");
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Filter>("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<CampaignSourceFilter>("all");
  const [leadSection, setLeadSection] = useState<LeadSection>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingLead, setAddingLead] = useState(false);
  const [importPreview, setImportPreview] = useState<{ file: File; rows: Record<string, string>[] } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [marketingLogs, setMarketingLogs] = useState<SpendLog[]>([]);
  const [categories, setCategories] = useState<CampaignCategory[]>([]);

  useEffect(() => {
    if (!canLoadMarketingData) return;
    let cancelled = false;

    async function loadMarketingData() {
      try {
        const [spendRes, categoryRes] = await Promise.all([
          fetch("/api/admin/marketing-spends", { cache: "no-store" }),
          fetch("/api/admin/categories", { cache: "no-store" }),
        ]);
        const [spendData, categoryData] = await Promise.all([
          spendRes.json().catch(() => ({})),
          categoryRes.json().catch(() => ({})),
        ]);

        if (cancelled) return;
        if (spendRes.ok && Array.isArray(spendData.spends)) {
          setMarketingLogs(spendData.spends as SpendLog[]);
        } else if (!spendRes.ok) {
          toast.error(spendData.error || "Failed to load marketing spends.");
        }

        if (categoryRes.ok && Array.isArray(categoryData.categories)) {
          setCategories(categoryData.categories as CampaignCategory[]);
        } else if (!categoryRes.ok) {
          toast.error(categoryData.error || "Failed to load campaigns.");
        }
      } catch {
        if (!cancelled) toast.error("Failed to load campaign data.");
      }
    }

    loadMarketingData();
    return () => {
      cancelled = true;
    };
  }, [canLoadMarketingData]);

  const greeting = useMemo(() => greetingFor(), []);
  const firstName = session.name.split(/\s+/)[0] || session.username;

  const gradeOptions = useMemo(() => {
    const grades = Array.from(new Set(leads.map((lead) => lead.grade).filter(Boolean))).sort();
    return ["all", ...grades];
  }, [leads]);
  const sourceOptions = useMemo(
    () => [
      { value: "all", label: "All campaigns" },
      ...campaignSourceOptions(categories),
    ],
    [categories],
  );
  const manualCampaignSourceOptions = useMemo(() => campaignSourceOptions(categories), [categories]);
  const activeSourceFilter: CampaignSourceFilter = sourceOptions.some(
    (option) => option.value === sourceFilter,
  )
    ? sourceFilter
    : "all";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const source = inferCampaignSource(lead, categories);
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (gradeFilter !== "all" && lead.grade !== gradeFilter) return false;
      if (activeSourceFilter !== "all" && source.name !== activeSourceFilter) return false;
      if (!q) return true;
      return [
        lead.student_name,
        lead.parent_name,
        lead.mobile_no,
        lead.email,
        lead.comment,
        lead.grade,
        source.name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [leads, search, statusFilter, gradeFilter, activeSourceFilter, categories]);

  const analytics = useMemo(
    () => analyzeLeads(filtered, marketingLogs, categories),
    [filtered, marketingLogs, categories],
  );

  const sectionedLeads = useMemo(() => {
    const section = LEAD_SECTIONS.find((item) => item.key === leadSection);
    if (!section?.statuses) return filtered;
    return filtered.filter((lead) => section.statuses?.includes(lead.status));
  }, [filtered, leadSection]);

  const selected = useMemo(
    () => leads.find((lead) => lead.id === selectedId) ?? null,
    [leads, selectedId],
  );

  const navItems = useMemo<NavItem[]>(
    () =>
      [
        canViewAnalytics && { key: "overview" as const, label: "Overview", icon: RiDashboardLine },
        canViewAnalytics && {
          key: "analytics" as const,
          label: "Analytics",
          icon: RiBarChartBoxLine,
        },
        canViewLeads && { key: "leads" as const, label: "Leads", icon: RiTeamLine },
        canUseUsers && { key: "users" as const, label: "Users", icon: RiShieldCheckLine },
        canViewLogs && { key: "logs" as const, label: "Logs", icon: RiFileList3Line },
        canViewCampaigns && {
          key: "campaigns" as const,
          label: "Campaigns",
          icon: RiPriceTag3Line,
        },
        canViewSpending && { key: "spending" as const, label: "Spending", icon: RiWalletLine },
        { key: "account" as const, label: "Account", icon: RiUserLine },
      ].filter(Boolean) as NavItem[],
    [canUseUsers, canViewAnalytics, canViewLeads, canViewLogs, canViewCampaigns, canViewSpending],
  );

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    gradeFilter !== "all" ||
    activeSourceFilter !== "all";

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setGradeFilter("all");
    setSourceFilter("all");
  }, []);

  const refresh = useCallback(async () => {
    if (!canViewLeads) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not refresh leads.");
      setLeads(data.leads as Lead[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not refresh leads.");
    } finally {
      setRefreshing(false);
    }
  }, [canViewLeads]);

  const patchLead = useCallback(
    async (id: string, patch: Partial<Lead>) => {
      const previous = leads;
      setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
      try {
        const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Update failed.");
        setLeads((current) => current.map((lead) => (lead.id === id ? (data.lead as Lead) : lead)));
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
      setLeads((current) => current.filter((lead) => lead.id !== id));
      setSelectedId(null);
      try {
        const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, { method: "DELETE" });
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

  const createManualLead = useCallback(async (draft: ManualLeadDraft) => {
    const res = await fetch("/api/admin/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not create lead.");
    setLeads((current) => [data.lead as Lead, ...current]);
    toast.success("Lead added.");
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/skei-portal/login");
    router.refresh();
  }, [router]);

  const exportCsv = useCallback(() => {
    const blob = new Blob([toCsv(sectionedLeads)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `skei-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sectionedLeads]);

  const handleFileSelect = useCallback(async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      toast.error("Could not read the file.");
      return;
    }
    const rows = parseCsv(text);
    if (rows.length === 0) {
      toast.error("No data rows found in the CSV file.");
      return;
    }
    setImportPreview({ file, rows });
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (!importPreview) return;
    const { rows } = importPreview;
    const res = await fetch("/api/admin/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Import failed.");
    const { imported, skipped } = data as { imported: number; skipped: number };
    if (imported === 0) {
      toast.warning(`No new leads imported — all ${skipped} row${skipped !== 1 ? "s" : ""} were duplicates or invalid.`);
    } else {
      toast.success(
        `${imported} lead${imported !== 1 ? "s" : ""} imported${skipped > 0 ? `, ${skipped} skipped (duplicates/invalid)` : ""}.`,
      );
    }
    await refresh();
  }, [importPreview, refresh]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="flex min-h-dvh">
        <aside className="hidden w-[244px] shrink-0 border-r border-line bg-surface/75 lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-line px-5">
            <BrandLogo priority className="h-9 w-auto" />
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
            {navItems.map((item) => (
              <SidebarButton
                key={item.key}
                item={item}
                active={view === item.key}
                onClick={setView}
              />
            ))}
          </nav>
          <div className="border-t border-line px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-clay/12 text-xs font-bold text-clay">
                {initials(session.name)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-fg">{session.name}</div>
                <div className="truncate text-xs text-muted">{session.email}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-bg/55 px-3 py-2 text-sm font-medium text-fg/75 transition-colors hover:bg-fg/[0.04] hover:text-fg"
            >
              <RiLogoutBoxRLine className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-xl">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:px-6 xl:px-8">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">
                    {greeting}, <span className="text-fg">{firstName}</span>
                  </p>
                  <h1 className="mt-1 text-lg font-semibold leading-tight text-fg sm:text-xl">
                    {view === "overview" && "Overview"}
                    {view === "analytics" && "Analytics"}
                    {view === "leads" && "Leads"}
                    {view === "users" && "Users"}
                    {view === "logs" && "Logs"}
                    {view === "campaigns" && "Campaigns"}
                    {view === "spending" && "Spending"}
                    {view === "account" && "Account"}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-muted sm:flex">
                    {session.role === "admin" ? (
                      <RiUserStarLine className="h-4 w-4 text-clay" />
                    ) : (
                      <RiUserLine className="h-4 w-4 text-muted" />
                    )}
                    {session.role}
                  </div>
                  <ThemeToggle />
                  <button
                    type="button"
                    onClick={logout}
                    className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:text-fg lg:hidden"
                    aria-label="Logout"
                  >
                    <RiLogoutBoxRLine className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:hidden">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {navItems.map((item) => (
                    <MobileNavButton
                      key={item.key}
                      item={item}
                      active={view === item.key}
                      onClick={setView}
                    />
                  ))}
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-5 sm:px-6 xl:px-8">
            {loadError && (
              <div className="mb-4 rounded-lg border border-clay/30 bg-clay/[0.06] px-4 py-3 text-sm text-clay-deep">
                {loadError}.
              </div>
            )}

            {(view === "overview" || view === "analytics" || view === "leads") && (
              <Toolbar
                search={search}
                setSearch={setSearch}
                gradeFilter={gradeFilter}
                setGradeFilter={setGradeFilter}
                gradeOptions={gradeOptions}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sourceFilter={activeSourceFilter}
                setSourceFilter={setSourceFilter}
                sourceOptions={sourceOptions}
                showCampaignFilter={true}
                hasFilters={hasFilters}
                clearFilters={clearFilters}
                refreshing={refreshing}
                refresh={refresh}
                addLead={() => setAddingLead(true)}
                exportCsv={exportCsv}
                importCsv={handleFileSelect}
                canAddLead={view === "leads" && canEditDetails}
                canExport={canExportLeads}
                exportDisabled={sectionedLeads.length === 0}
                canImport={view === "leads" && canEditDetails}
              />
            )}

            {view === "overview" && canViewAnalytics && (
              <OverviewView
                analytics={analytics}
                setView={setView}
                setStatusFilter={setStatusFilter}
                setLeadSection={setLeadSection}
              />
            )}

            {view === "analytics" && canViewAnalytics && <AnalyticsView analytics={analytics} />}

            {view === "leads" && (
              <LeadsView
                leads={sectionedLeads}
                allLeads={leads}
                categories={categories}
                leadSection={leadSection}
                setLeadSection={setLeadSection}
                onOpen={setSelectedId}
                onStatusChange={(id, status) => patchLead(id, { status })}
                canManageStatus={canManageStatus}
              />
            )}

            {view === "users" && canUseUsers && <UsersView session={session} />}

            {view === "logs" && canViewLogs && <LogsView />}

            {view === "campaigns" && canViewCampaigns && (
              <CampaignsView
                categories={categories}
                canManage={canManageCampaigns}
                onCategoriesUpdate={setCategories}
              />
            )}

            {view === "spending" && canViewSpending && (
              <SpendingView
                logs={marketingLogs}
                onLogsUpdate={setMarketingLogs}
                categories={categories}
                canManage={canManageSpending}
              />
            )}

            {view === "account" && <AccountView session={session} />}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selected && (
          <LeadDetail
            lead={selected}
            canEditRemarks={canEditRemarks}
            canEditDetails={canEditDetails}
            canManageStatus={canManageStatus}
            canDelete={canDeleteLeads}
            onClose={() => setSelectedId(null)}
            onPatch={patchLead}
            onDelete={removeLead}
          />
        )}
      </AnimatePresence>
      {addingLead && (
        <ManualLeadDialog
          onClose={() => setAddingLead(false)}
          sourceOptions={manualCampaignSourceOptions}
          onCreate={async (draft) => {
            await createManualLead(draft);
            setAddingLead(false);
          }}
        />
      )}
      {importPreview && (
        <ImportCsvDialog
          file={importPreview.file}
          rows={importPreview.rows}
          onConfirm={handleImportConfirm}
          onClose={() => setImportPreview(null)}
        />
      )}
    </div>
  );
}
