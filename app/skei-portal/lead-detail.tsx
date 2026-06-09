"use client";

import {
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMailLine,
  RiPhoneLine,
  RiSaveLine,
} from "@remixicon/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { EASE } from "@/lib/animations";
import { EDITABLE_LEAD_FIELDS, LEAD_STATUSES, type Lead } from "@/types/lead";
import { ORANGE_ACCENT } from "./portal-constants";
import { hexA } from "./status";

const FIELD_LABELS: Record<(typeof EDITABLE_LEAD_FIELDS)[number], string> = {
  student_name: "Student name",
  grade: "Grade",
  dob: "Date of birth",
  gender: "Gender",
  parent_name: "Parent name",
  mobile_no: "Mobile",
  email: "Email",
  comment: "Comment",
};

export function LeadDetail({
  lead,
  canEditRemarks,
  canEditDetails,
  canManageStatus,
  canDelete,
  onClose,
  onPatch,
  onDelete,
}: {
  lead: Lead;
  canEditRemarks: boolean;
  canEditDetails: boolean;
  canManageStatus: boolean;
  canDelete: boolean;
  onClose: () => void;
  onPatch: (id: string, patch: Partial<Lead>) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [remark, setRemark] = useState(lead.remark);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Lead>(lead);
  const [savingRemark, setSavingRemark] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const remarkDirty = remark.trim() !== lead.remark.trim();

  const saveRemark = async () => {
    setSavingRemark(true);
    await onPatch(lead.id, { remark });
    setSavingRemark(false);
  };

  const saveDetails = async () => {
    const patch: Partial<Lead> = {};
    for (const field of EDITABLE_LEAD_FIELDS) {
      if (draft[field] !== lead[field]) patch[field] = draft[field];
    }
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }
    setSavingDetails(true);
    const ok = await onPatch(lead.id, patch);
    setSavingDetails(false);
    if (ok) setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close lead details"
      />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.3, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-lift sm:h-auto sm:max-h-[92dvh] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
          <div>
            <h2 id="lead-detail-title" className="text-base font-semibold text-fg">
              {lead.student_name || "Lead"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {lead.grade || "—"} · Submitted {lead.submit_date || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-fg"
            aria-label="Close"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-5">
          {/* Status */}
          <div>
            <SectionLabel>Status</SectionLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {LEAD_STATUSES.map((status) => {
                const active = lead.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={!canManageStatus}
                    onClick={() =>
                      canManageStatus && status !== lead.status && onPatch(lead.id, { status })
                    }
                    className="rounded-full border px-3 py-1 text-xs font-semibold transition-all disabled:cursor-default"
                    style={{
                      color: active ? "#fff" : ORANGE_ACCENT,
                      backgroundColor: active ? ORANGE_ACCENT : hexA(ORANGE_ACCENT, 0.1),
                      borderColor: hexA(ORANGE_ACCENT, active ? 1 : 0.3),
                      opacity: !canManageStatus && !active ? 0.5 : 1,
                    }}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            {!canManageStatus && (
              <p className="mt-1.5 text-[0.7rem] text-muted/70">
                Status changes are not enabled for this account.
              </p>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center justify-between">
              <SectionLabel>Enquiry details</SectionLabel>
              {canEditDetails &&
                (editing ? (
                  <button
                    type="button"
                    onClick={saveDetails}
                    disabled={savingDetails}
                    className="flex items-center gap-1 text-xs font-semibold text-clay hover:text-clay-deep disabled:opacity-60"
                  >
                    <RiSaveLine className="h-3.5 w-3.5" /> {savingDetails ? "Saving…" : "Save"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(lead);
                      setEditing(true);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-fg"
                  >
                    <RiEditLine className="h-3.5 w-3.5" /> Edit
                  </button>
                ))}
            </div>

            <dl className="mt-2 divide-y divide-line/60 overflow-hidden rounded-xl border border-line">
              {EDITABLE_LEAD_FIELDS.map((field) => (
                <div key={field} className="grid grid-cols-3 items-center gap-2 px-3.5 py-2.5">
                  <dt className="text-xs text-muted">{FIELD_LABELS[field]}</dt>
                  <dd className="col-span-2 text-sm text-fg">
                    {editing ? (
                      <input
                        value={draft[field]}
                        onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                        className="w-full rounded-lg border border-fg/15 bg-bg/60 px-2.5 py-1.5 text-sm text-fg outline-none focus:border-clay/50 focus:ring-2 focus:ring-clay/25"
                      />
                    ) : (
                      <span className="break-words">{lead[field] || "—"}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {!editing && (
              <div className="mt-2 flex gap-2">
                {lead.mobile_no && (
                  <a
                    href={`tel:${lead.mobile_no}`}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-bg/50 px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-bg"
                  >
                    <RiPhoneLine className="h-3.5 w-3.5 text-clay" /> Call
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-bg/50 px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-bg"
                  >
                    <RiMailLine className="h-3.5 w-3.5 text-clay" /> Email
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Remark */}
          <div>
            <SectionLabel>Remark</SectionLabel>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={!canEditRemarks}
              rows={3}
              placeholder="Add a note about this lead…"
              className="mt-2 w-full resize-none rounded-xl border border-fg/15 bg-bg/60 px-3.5 py-2.5 text-sm text-fg placeholder:text-muted/60 outline-none transition-all focus:border-clay/50 focus:bg-surface focus:ring-2 focus:ring-clay/25 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[0.7rem] text-muted/70">
                {lead.updated_by
                  ? `Last updated by ${lead.updated_by}${lead.updated_at ? ` · ${lead.updated_at}` : ""}`
                  : "No updates yet"}
              </span>
              <button
                type="button"
                onClick={saveRemark}
                disabled={!canEditRemarks || !remarkDirty || savingRemark}
                className="rounded-full bg-clay px-4 py-1.5 text-xs font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingRemark ? "Saving…" : "Save remark"}
              </button>
            </div>
          </div>

          </div>
        </div>

        <div className="shrink-0 flex items-center justify-between gap-2 border-t border-line bg-surface px-5 py-4">
          <div>
            {canDelete &&
              (confirmDelete ? (
                <span className="text-xs text-clay-deep">Delete this lead permanently?</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-lg px-1 text-xs font-medium text-muted transition-colors hover:text-clay"
                >
                  <RiDeleteBinLine className="h-3.5 w-3.5" /> Delete lead
                </button>
              ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-muted transition-colors hover:text-fg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(lead.id)}
                  className="h-10 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep"
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-muted transition-colors hover:text-fg"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
      {children}
    </span>
  );
}
