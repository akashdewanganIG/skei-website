"use client";

import { RiCloseCircleLine, RiUserAddLine } from "@remixicon/react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { CampaignSourceName } from "@/lib/campaign-attribution";
import { EMPTY_LEAD_FORM, LEAD_STATUS_OPTIONS } from "../portal-constants";
import type { ManualLeadDraft, SelectOption } from "../portal-types";
import { SelectField, TextInput } from "./form-fields";

const GRADES = [
  "Early Years (Nursery-Prep)",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
];
const GRADE_OPTIONS: SelectOption[] = [{ value: "", label: "Grade" }, ...GRADES.map((g) => ({ value: g, label: g }))];

export function ManualLeadDialog({
  onClose,
  onCreate,
  sourceOptions,
}: {
  onClose: () => void;
  onCreate: (draft: ManualLeadDraft) => Promise<void>;
  sourceOptions: SelectOption<CampaignSourceName>[];
}) {
  const [draft, setDraft] = useState<ManualLeadDraft>(EMPTY_LEAD_FORM);
  const [saving, setSaving] = useState(false);

  const updateDraft = (patch: Partial<ManualLeadDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const missing = [];
    if (draft.student_name.trim().length < 2) missing.push("Student name");
    if (!draft.grade) missing.push("Grade");
    if (!draft.dob) missing.push("Date of birth");
    if (!draft.gender) missing.push("Gender");
    if (!activeSource) missing.push("Campaign source");
    if (draft.parent_name.trim().length < 2) missing.push("Parent name");
    if (!/^\d{10}$/.test(draft.mobile_no.replace(/\D/g, ""))) missing.push("Valid 10-digit mobile number");

    if (missing.length > 0) {
      const message = missing.length === 1 
        ? `${missing[0]} is required.`
        : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]} are required.`;
      toast.error(message);
      return;
    }
    setSaving(true);
    try {
      await onCreate({ ...draft, source: activeSource });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create lead.");
    } finally {
      setSaving(false);
    }
  };

  const activeSource = sourceOptions.some((option) => option.value === draft.source)
    ? draft.source
    : sourceOptions[0]?.value ?? "";
  const selectedSource = sourceOptions.find((option) => option.value === activeSource);
  const selectedStatus =
    LEAD_STATUS_OPTIONS.find((option) => option.value === draft.status) ?? LEAD_STATUS_OPTIONS[0];
  const genderOptions: SelectOption[] = [
    { value: "", label: "Gender" },
    { value: "Female", label: "Female" },
    { value: "Male", label: "Male" },
    { value: "Other", label: "Other" },
  ];
  const selectedGender =
    genderOptions.find((option) => option.value === draft.gender) ?? genderOptions[0];
  const selectedGrade =
    GRADE_OPTIONS.find((option) => option.value === draft.grade) ?? GRADE_OPTIONS[0];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-lead-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close add lead"
      />
      <form
        onSubmit={submit}
        className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-lift sm:rounded-2xl"
      >
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
          <div>
            <h2 id="manual-lead-title" className="text-base font-semibold text-fg">
              Add lead
            </h2>
            <p className="mt-1 text-xs text-muted">Capture call and walk-in enquiries manually.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-fg"
            aria-label="Close"
          >
            <RiCloseCircleLine className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Student name *"
            value={draft.student_name}
            onChange={(value) => updateDraft({ student_name: value })}
          />
          <TextInput
            label="Parent name *"
            value={draft.parent_name}
            onChange={(value) => updateDraft({ parent_name: value })}
          />
          <TextInput
            label="Mobile *"
            value={draft.mobile_no}
            onChange={(value) => updateDraft({ mobile_no: value })}
          />
          <TextInput
            label="Email"
            type="email"
            value={draft.email}
            onChange={(value) => updateDraft({ email: value })}
          />
          <SelectField
            label="Grade *"
            instanceId="manual-lead-grade"
            options={GRADE_OPTIONS}
            value={selectedGrade}
            onChange={(option) => updateDraft({ grade: option.value })}
          />
          <TextInput
            label="Date of birth *"
            type="date"
            value={draft.dob}
            onChange={(value) => updateDraft({ dob: value })}
          />
          <SelectField
            label="Gender *"
            instanceId="manual-lead-gender"
            options={genderOptions}
            value={selectedGender}
            onChange={(option) => updateDraft({ gender: option.value })}
          />
          {selectedSource ? (
            <SelectField
              label="Campaign source"
              instanceId="manual-lead-source"
              options={sourceOptions}
              value={selectedSource}
              onChange={(option) => updateDraft({ source: option.value })}
            />
          ) : (
            <div className="rounded-lg border border-line bg-bg/35 px-3 py-2 text-xs text-muted">
              Add a campaign source before creating manual leads.
            </div>
          )}
          <SelectField
            label="Status"
            instanceId="manual-lead-status"
            options={LEAD_STATUS_OPTIONS}
            value={selectedStatus}
            onChange={(option) => updateDraft({ status: option.value })}
          />
          <TextInput
            label="Remark"
            value={draft.remark}
            onChange={(value) => updateDraft({ remark: value })}
          />
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-xs font-semibold text-muted">Call notes</span>
            <textarea
              value={draft.comment}
              onChange={(event) => updateDraft({ comment: event.target.value })}
              rows={4}
              className="resize-none rounded-lg border border-line bg-bg/45 px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-clay/50 focus:ring-2 focus:ring-clay/20"
            />
          </label>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end gap-2 border-t border-line px-5 py-4 bg-surface">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-muted transition-colors hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RiUserAddLine className="h-4 w-4" />
            {saving ? "Adding..." : "Add lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
