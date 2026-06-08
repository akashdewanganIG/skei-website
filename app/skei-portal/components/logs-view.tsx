"use client";

import { RiRefreshLine } from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AuditLogSummary } from "../portal-types";
import { formatLogTime, shortId } from "../portal-utils";
import { EmptyInline } from "./empty-states";

export function LogsView() {
  const [logs, setLogs] = useState<AuditLogSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load logs.");
      setLogs(data.logs as AuditLogSummary[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load protected admin logs after the client session UI mounts.
    loadLogs();
  }, [loadLogs]);

  return (
    <section className="rounded-lg border border-line bg-surface shadow-soft">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">Change logs</h2>
          <p className="mt-1 text-xs text-muted">Recent portal changes by user.</p>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-fg"
        >
          <RiRefreshLine className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="p-6 text-sm text-muted">Loading logs...</div>
      ) : logs.length === 0 ? (
        <EmptyInline text="No logs recorded yet." />
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-line bg-bg/45 text-left text-[0.68rem] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">Summary</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-line/70 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {formatLogTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-fg">
                        {log.actorName || log.actorUsername}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        <span>{log.actorUsername}</span>
                        <span className="rounded-md border border-line bg-bg/60 px-1.5 py-0.5 text-[0.65rem] uppercase">
                          {log.actorRole || "user"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {log.entityType}
                      {log.entityId ? ` / ${shortId(log.entityId)}` : ""}
                    </td>
                    <td className="px-4 py-3 text-fg">{log.summary || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-4 lg:hidden">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-line bg-bg/35 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-fg">{log.summary || log.action}</div>
                    <div className="mt-1 text-xs text-muted">{formatLogTime(log.createdAt)}</div>
                  </div>
                  <ActionBadge action={log.action} />
                </div>
                <div className="mt-3 text-xs text-muted">
                  {log.actorName || log.actorUsername} / {log.actorRole || "user"} /{" "}
                  {log.entityType}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ActionBadge({ action }: { action: string }) {
  const tone = action.startsWith("user")
    ? { bg: "#3f7cac22", fg: "#3f7cac" }
    : action.includes("delete")
      ? { bg: "#d9481e18", fg: "#d9481e" }
      : action.includes("password")
        ? { bg: "#7c5f9f22", fg: "#7c5f9f" }
        : { bg: "#2f8f5b22", fg: "#2f8f5b" };

  return (
    <span
      className="inline-flex rounded-lg px-2.5 py-1 text-[0.7rem] font-semibold"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      {action.replace(/\./g, " ")}
    </span>
  );
}
