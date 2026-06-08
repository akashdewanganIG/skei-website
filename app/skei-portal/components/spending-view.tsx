"use client";

import { RiDeleteBinLine, RiSaveLine } from "@remixicon/react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { campaignParentOptions } from "@/lib/campaign-attribution";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CampaignCategory, SelectOption, SpendLog } from "../portal-types";
import { formatCurrency } from "../portal-utils";
import { EmptyInline } from "./empty-states";
import { SelectField, TextInput } from "./form-fields";

type DurationMode = "all" | "custom";

const DURATION_OPTIONS: SelectOption<DurationMode>[] = [
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
];

function dateInputValue(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function inRange(log: SpendLog, mode: DurationMode, startDate: string, endDate: string): boolean {
  if (mode === "all") return true;
  const time = new Date(log.date).getTime();
  const start = startDate ? new Date(startDate).getTime() : Number.NEGATIVE_INFINITY;
  const end = endDate ? new Date(`${endDate}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
  return time >= start && time <= end;
}

export function SpendingView({
  logs,
  onLogsUpdate,
  categories,
  canManage,
}: {
  logs: SpendLog[];
  onLogsUpdate: (logs: SpendLog[]) => void;
  categories: CampaignCategory[];
  canManage: boolean;
}) {
  const parentOptions = useMemo(() => campaignParentOptions(categories), [categories]);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState(parentOptions[0]?.value ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => dateInputValue());
  const [durationMode, setDurationMode] = useState<DurationMode>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const activeSource = parentOptions.some((option) => option.value === source)
    ? source
    : parentOptions[0]?.value ?? "";

  const selectedSource =
    parentOptions.find((option) => option.value === activeSource) ?? parentOptions[0];
  const selectedDuration =
    DURATION_OPTIONS.find((option) => option.value === durationMode) ?? DURATION_OPTIONS[0];

  const filteredLogs = useMemo(
    () => logs.filter((log) => inRange(log, durationMode, startDate, endDate)),
    [logs, durationMode, startDate, endDate],
  );

  const chartData = useMemo(() => {
    const totals = new Map<string, { name: string; amount: number; color: string }>();
    for (const category of categories) {
      totals.set(category.name, { name: category.name, amount: 0, color: category.color });
    }
    for (const log of filteredLogs) {
      const category = categories.find((item) => item.name === log.source);
      const row = totals.get(log.source) ?? {
        name: log.source,
        amount: 0,
        color: category?.color ?? "#d9481e",
      };
      row.amount += Number(log.amount) || 0;
      totals.set(log.source, row);
    }
    return Array.from(totals.values()).filter((item) => item.amount > 0);
  }, [categories, filteredLogs]);

  const totalSpend = filteredLogs.reduce((sum, log) => sum + (Number(log.amount) || 0), 0);

  const handleAddSpend = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeSource || !amount || !date) {
      return toast.error("Campaign group, amount, and date are required.");
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/marketing-spends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: activeSource, amount: Number(amount), date }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to log spend.");

      onLogsUpdate(
        [data.spend as SpendLog, ...logs].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
      setAmount("");
      toast.success("Spend logged.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to log spend.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Delete this spending log?")) return;
    try {
      const response = await fetch(`/api/admin/marketing-spends?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to delete spend.");
      onLogsUpdate(logs.filter((log) => log.id !== id));
      toast.success("Spending log deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete spend.");
    }
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        {canManage && (
          <div className="rounded-lg border border-line bg-surface shadow-soft">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-fg">Add spending</h2>
              <p className="mt-1 text-xs text-muted">Log spend against a campaign group.</p>
            </div>
            <form onSubmit={handleAddSpend} className="grid gap-4 p-4">
              {parentOptions.length === 0 ? (
                <EmptyInline text="Create a campaign group before logging spend." />
              ) : (
                <SelectField
                  label="Campaign group"
                  instanceId="spend-campaign-group"
                  options={parentOptions}
                  value={selectedSource}
                  onChange={(option) => setSource(option.value)}
                />
              )}
              <TextInput
                label="Amount spent (INR)"
                type="number"
                value={amount}
                onChange={setAmount}
                placeholder="25000"
                required
              />
              <TextInput label="Spend date" type="date" value={date} onChange={setDate} required />
              <button
                type="submit"
                disabled={saving || parentOptions.length === 0}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RiSaveLine className="h-4 w-4" />
                {saving ? "Saving..." : "Log spend"}
              </button>
            </form>
          </div>
        )}

        <div className="rounded-lg border border-line bg-surface shadow-soft">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-fg">Spending overview</h2>
              <p className="mt-1 text-xs text-muted">
                {formatCurrency(totalSpend)} across {filteredLogs.length} ledger entries
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[150px_1fr_1fr]">
              <SelectField
                label="Duration"
                instanceId="spending-duration"
                options={DURATION_OPTIONS}
                value={selectedDuration}
                onChange={(option) => setDurationMode(option.value)}
              />
              {durationMode === "custom" && (
                <>
                  <TextInput label="From" type="date" value={startDate} onChange={setStartDate} />
                  <TextInput label="To" type="date" value={endDate} onChange={setEndDate} />
                </>
              )}
            </div>
          </div>
          <div className="p-4">
            <SpendingChart data={chartData} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface shadow-soft">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">Spending ledger</h2>
          <p className="mt-1 text-xs text-muted">Filtered by the selected duration.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg/45 text-[0.68rem] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Campaign group</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Added by</th>
                {canManage && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-4 py-8 text-center text-muted">
                    No spending logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-bg/45">
                    <td className="px-4 py-3 text-fg">
                      {new Date(log.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-medium text-fg">{log.source}</td>
                    <td className="px-4 py-3 text-right font-semibold text-fg">
                      {formatCurrency(Number(log.amount) || 0)}
                    </td>
                    <td className="px-4 py-3 text-muted">{log.addedBy || "-"}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-clay/10 hover:text-clay"
                          aria-label="Delete spending log"
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SpendingChart({ data }: { data: { name: string; amount: number; color: string }[] }) {
  if (data.length === 0) {
    return (
      <div className="grid h-[280px] place-items-center rounded-lg border border-dashed border-line text-sm text-muted">
        No spending data for this duration.
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 28, left: 12, bottom: 8 }}>
          <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatCurrency(Number(value)).replace(".00", "")}
            width={82}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(217,72,30,0.06)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-line bg-surface/95 px-3 py-2 text-xs shadow-lift">
                  <div className="font-semibold text-fg">{label}</div>
                  <div className="mt-1 text-muted">
                    Total:{" "}
                    <span className="font-semibold text-fg">
                      {formatCurrency(Number(payload[0].value) || 0)}
                    </span>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={34}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
