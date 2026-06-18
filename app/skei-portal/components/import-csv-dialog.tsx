"use client";

import { RiCloseCircleLine, RiEdit2Line, RiUploadLine } from "@remixicon/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { LEAD_IMPORT_COLUMNS } from "../portal-utils";

const PREVIEW_LIMIT = 5;
// The compact preview hides the long "Comment" column; it is editable in the full editor.
const PREVIEW_COLUMNS = LEAD_IMPORT_COLUMNS.filter((col) => col.key !== "comment");

type Row = Record<string, string>;

export function ImportCsvDialog({
  file,
  rows,
  onConfirm,
  onClose,
}: {
  file: File;
  rows: Row[];
  onConfirm: (rows: Row[]) => Promise<void>;
  onClose: () => void;
}) {
  const [data, setData] = useState<Row[]>(() => rows.map((r) => ({ ...r })));
  const [editing, setEditing] = useState(false);
  const [importing, setImporting] = useState(false);
  // Stable snapshot the editor renders from — read during render, so it is state.
  const [editorRows, setEditorRows] = useState<Row[]>([]);
  // Live edits land here (uncontrolled inputs) so typing doesn't re-render the
  // whole table; only mutated in handlers and committed to state when saved.
  const draftRef = useRef<Row[]>([]);

  const preview = data.slice(0, PREVIEW_LIMIT);
  const hidden = Math.max(0, data.length - PREVIEW_LIMIT);

  function openEditor() {
    draftRef.current = data.map((r) => ({ ...r }));
    setEditorRows(data.map((r) => ({ ...r })));
    setEditing(true);
  }
  function saveEditor() {
    setData(draftRef.current.map((r) => ({ ...r })));
    setEditing(false);
  }

  async function handleConfirm() {
    setImporting(true);
    try {
      await onConfirm(data);
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
              Import leads
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
            <span className="font-semibold">{data.length.toLocaleString()} leads</span> found and matched to fields.
            Duplicate and invalid rows are skipped automatically during import.
          </p>

          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line bg-bg/45">
                  {PREVIEW_COLUMNS.map((col) => (
                    <th key={col.key} className="px-3 py-2 text-left font-semibold text-muted">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {PREVIEW_COLUMNS.map((col) => (
                      <td key={col.key} className="max-w-[160px] truncate px-3 py-2 text-fg/80">
                        {row[col.key] || <span className="text-muted/40">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-clay/20 bg-clay/[0.04] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">
              Showing the first {Math.min(PREVIEW_LIMIT, data.length)} of {data.length.toLocaleString()} leads.
              {hidden > 0 ? ` ${hidden.toLocaleString()} more are not shown.` : ""} To review or correct any value
              before importing,{" "}
              <button
                type="button"
                onClick={openEditor}
                disabled={importing}
                className="font-semibold text-clay underline underline-offset-2 transition-colors hover:text-clay-deep disabled:opacity-50"
              >
                tap here
              </button>
              .
            </p>
            <button
              type="button"
              onClick={openEditor}
              disabled={importing}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-clay/40 bg-surface px-3 py-2 text-xs font-semibold text-clay transition-colors hover:bg-clay/10 disabled:opacity-50"
            >
              <RiEdit2Line className="h-4 w-4" />
              Review &amp; edit all leads
            </button>
          </div>
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
            disabled={importing || data.length === 0}
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
                Import {data.length.toLocaleString()} leads
              </>
            )}
          </button>
        </div>
      </div>

      {editing && (
        <FullEditor
          rows={editorRows}
          onChange={(i, key, value) => {
            draftRef.current[i][key] = value;
          }}
          onCancel={() => setEditing(false)}
          onSave={saveEditor}
        />
      )}
    </div>
  );
}

function FullEditor({
  rows,
  onChange,
  onCancel,
  onSave,
}: {
  rows: Row[];
  onChange: (index: number, key: string, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[105] flex items-stretch justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit leads before import"
    >
      <div className="relative flex max-h-dvh w-full max-w-6xl flex-col overflow-hidden border border-line bg-surface shadow-lift sm:max-h-[96dvh] sm:rounded-2xl">
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-fg">Review &amp; edit leads</h2>
            <p className="mt-1 text-xs text-muted">
              {rows.length.toLocaleString()} leads · edit any cell, then save to apply your changes.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-fg"
            aria-label="Discard edits"
          >
            <RiCloseCircleLine className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-bg">
              <tr className="border-b border-line">
                <th className="w-12 px-2 py-2 text-left font-semibold text-muted">#</th>
                {LEAD_IMPORT_COLUMNS.map((col) => (
                  <th key={col.key} className="px-2 py-2 text-left font-semibold text-muted">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-line/60">
                  <td className="px-2 py-1 text-muted/60">{i + 1}</td>
                  {LEAD_IMPORT_COLUMNS.map((col) => (
                    <td key={col.key} className="px-1 py-1">
                      <input
                        defaultValue={row[col.key] ?? ""}
                        onChange={(e) => onChange(i, col.key, e.target.value)}
                        className={`h-8 w-full rounded border border-transparent bg-transparent px-2 text-fg outline-none transition-colors hover:border-line focus:border-clay/50 focus:bg-bg ${
                          col.key === "comment" ? "min-w-[280px]" : "min-w-[120px]"
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 flex items-center justify-between gap-2 border-t border-line bg-surface px-5 py-4">
          <p className="hidden text-xs text-muted sm:block">
            Gender codes, dates and phone numbers were normalized automatically.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-muted transition-colors hover:text-fg"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onSave}
              className="h-10 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
