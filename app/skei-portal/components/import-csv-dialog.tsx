"use client";

import { RiCloseLine, RiUploadLine } from "@remixicon/react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-line bg-bg shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-semibold text-fg">Import CSV</h2>
            <p className="mt-0.5 truncate text-xs text-muted">{file.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg disabled:opacity-40"
            aria-label="Close"
          >
            <RiCloseLine className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-fg">
            <span className="font-semibold">{rows.length.toLocaleString()} rows</span> found.
            Duplicate mobile numbers and invalid rows will be skipped automatically.
          </p>

          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line bg-surface">
                  {PREVIEW_COLUMNS.map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-medium text-muted">
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

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-fg/75 transition-colors hover:bg-fg/[0.04] hover:text-fg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={importing}
            className="flex items-center gap-2 rounded-lg bg-clay px-4 py-2 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-50"
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
