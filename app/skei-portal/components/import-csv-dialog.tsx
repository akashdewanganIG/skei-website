"use client";

import { RiCloseCircleLine, RiUploadLine } from "@remixicon/react";
import { useState } from "react";
import { toast } from "sonner";

const PREVIEW_COLUMNS = [
  "student_name",
  "grade",
  "mobile_no",
  "parent_name",
  "source",
  "status",
] as const;

export function ImportCsvDialog({
  file,
  rows,
  onConfirm,
  onClose,
}: {
  file: File;
  rows: Record<string, string>[];
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [importing, setImporting] = useState(false);
  const preview = rows.slice(0, 5);

  async function handleConfirm() {
    setImporting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.");
      setImporting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-csv-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        disabled={importing}
        aria-label="Close import"
      />
      <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-lift sm:rounded-2xl">
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
          <div className="min-w-0">
            <h2 id="import-csv-title" className="text-base font-semibold text-fg">
              Import CSV
            </h2>
            <p className="mt-1 truncate text-xs text-muted">{file.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-fg disabled:opacity-40"
            aria-label="Close"
          >
            <RiCloseCircleLine className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-sm text-fg">
            <span className="font-semibold">{rows.length.toLocaleString()} rows</span> found.
            Duplicate mobile numbers and invalid rows will be skipped automatically.
          </p>

          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line bg-bg/45">
                  {PREVIEW_COLUMNS.map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-semibold text-muted">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {PREVIEW_COLUMNS.map((col) => (
                      <td key={col} className="max-w-[140px] truncate px-3 py-2 text-fg/80">
                        {row[col] || <span className="text-muted/40">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 5 && (
            <p className="mt-2 text-xs text-muted">
              Showing first 5 of {rows.length.toLocaleString()} rows.
            </p>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 border-t border-line bg-surface px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-muted transition-colors hover:text-fg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={importing}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory/30 border-t-ivory" />
                Importing...
              </>
            ) : (
              <>
                <RiUploadLine className="h-4 w-4" />
                Import {rows.length.toLocaleString()} rows
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
