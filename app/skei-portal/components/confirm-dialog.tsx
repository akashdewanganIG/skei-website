"use client";

import { RiAlertLine, RiCloseCircleLine } from "@remixicon/react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  children,
  onConfirm,
  onClose,
}: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Optional extra controls (e.g. a checkbox) rendered below the message. */
  children?: ReactNode;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        disabled={busy}
        aria-label={cancelLabel}
      />
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-lift sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                destructive ? "bg-clay/10 text-clay" : "bg-bg text-muted"
              }`}
            >
              <RiAlertLine className="h-5 w-5" />
            </span>
            <h2 id="confirm-dialog-title" className="mt-1 text-base font-semibold text-fg">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-fg disabled:opacity-40"
            aria-label="Close"
          >
            <RiCloseCircleLine className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5 text-sm leading-relaxed text-muted">
          {message}
          {children && <div className="mt-4">{children}</div>}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-surface px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-muted transition-colors hover:text-fg disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory/30 border-t-ivory" />
                Working...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
