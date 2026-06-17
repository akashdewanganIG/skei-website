"use client";

import {
  RiAddLine,
  RiCloseCircleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiSaveLine,
} from "@remixicon/react";
import { type FormEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { inferCampaignSource } from "@/lib/campaign-attribution";
import type { Lead } from "@/types/lead";
import type { CampaignCategory } from "../portal-types";
import { ConfirmDialog } from "./confirm-dialog";

const DEFAULT_COLOR = "#d9481e";

function splitSources(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function splitTags(value: string): string[] {
  return splitSources(value);
}

export function CampaignsView({
  categories,
  leads,
  canManage,
  canDeleteLeads,
  onCategoriesUpdate,
  onLeadsDeleted,
}: {
  categories: CampaignCategory[];
  leads: Lead[];
  canManage: boolean;
  canDeleteLeads: boolean;
  onCategoriesUpdate: (
    categories: CampaignCategory[],
    rename?: { from: string; to: string },
  ) => void;
  onLeadsDeleted: (ids: string[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [sourcesText, setSourcesText] = useState("");
  const [utmTagsDraft, setUtmTagsDraft] = useState<Record<string, string>>({});
  const [adPlatform, setAdPlatform] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CampaignCategory | null>(null);
  const [alsoDeleteLeads, setAlsoDeleteLeads] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  const affectedLeadIds = useMemo(() => {
    if (!deleteTarget) return [];
    return leads
      .filter((lead) => inferCampaignSource(lead, categories).parent === deleteTarget.name)
      .map((lead) => lead.id);
  }, [deleteTarget, leads, categories]);

  const sourcePreview = useMemo(() => splitSources(sourcesText), [sourcesText]);
  const tagTargets = useMemo(() => {
    const groupName = name.trim();
    if (sourcePreview.length > 0) return sourcePreview;
    return groupName ? [groupName] : [];
  }, [name, sourcePreview]);
  const editing = categories.find((category) => category.id === editingId) ?? null;

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setColor(DEFAULT_COLOR);
    setSourcesText("");
    setUtmTagsDraft({});
    setAdPlatform(false);
  };

  const startEdit = (category: CampaignCategory) => {
    setEditingId(category.id);
    setName(category.name);
    setColor(category.color);
    setAdPlatform(category.adPlatform);
    setSourcesText(category.subcategories.join(", "));
    const targets = category.subcategories.length > 0 ? category.subcategories : [category.name];
    setUtmTagsDraft(
      Object.fromEntries(
        targets.map((target) => [target, (category.utmTags?.[target] ?? []).join(", ")]),
      ),
    );
    // Bring the edit form into view so the change is obvious on long lists.
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    const campaignSources = splitSources(sourcesText);
    if (!name.trim()) return toast.error("Campaign group is required.");
    const activeTagTargets = campaignSources.length > 0 ? campaignSources : [name.trim()];
    const utmTags = Object.fromEntries(
      activeTagTargets
        .map((target) => [target, splitTags(utmTagsDraft[target] ?? "")] as const)
        .filter(([, tags]) => tags.length > 0),
    );

    setSaving(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          name: name.trim(),
          color,
          subcategories: campaignSources,
          utmTags,
          adPlatform,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save campaign group.");

      const saved = data.category as CampaignCategory;
      const rename =
        editing && editing.name !== saved.name ? { from: editing.name, to: saved.name } : undefined;
      onCategoriesUpdate(
        editing
          ? categories.map((category) => (category.id === saved.id ? saved : category))
          : [...categories, saved],
        rename,
      );
      toast.success(editing ? "Campaign group updated." : "Campaign group created.");
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save campaign group.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (category: CampaignCategory) => {
    setDeleteTarget(category);
    setAlsoDeleteLeads(false);
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    const removeLeads = alsoDeleteLeads && canDeleteLeads && affectedLeadIds.length > 0;

    const response = await fetch(
      `/api/admin/categories?id=${encodeURIComponent(deleteTarget.id)}`,
      {
        method: "DELETE",
        ...(removeLeads
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ deleteLeadIds: affectedLeadIds }),
            }
          : {}),
      },
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not delete campaign group.");

    onCategoriesUpdate(categories.filter((item) => item.id !== deleteTarget.id));
    if (editingId === deleteTarget.id) resetForm();
    if (removeLeads) {
      onLeadsDeleted(affectedLeadIds);
      const count = data.deletedLeads ?? affectedLeadIds.length;
      toast.success(`Campaign group and ${count} lead${count === 1 ? "" : "s"} deleted.`);
    } else {
      toast.success("Campaign group deleted.");
    }
  };

  return (
    <div className="space-y-5">
      {canManage && (
        <section
          ref={formRef}
          className="scroll-mt-24 rounded-lg border border-line bg-surface shadow-soft"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-fg">
                {editing ? "Edit campaign group" : "Add campaign group"}
              </h2>
              <p className="mt-1 text-xs text-muted">Manage campaign groups used by analytics.</p>
            </div>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-bg hover:text-fg"
                aria-label="Cancel edit"
              >
                <RiCloseCircleLine className="h-4 w-4" />
              </button>
            )}
          </div>
          <form onSubmit={saveCategory} className="grid gap-4 p-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(180px,0.65fr)_minmax(260px,1fr)_auto] lg:items-end">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">Campaign group</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-10 rounded-lg border border-line bg-bg/45 px-3 text-sm text-fg outline-none transition-colors focus:border-clay/50 focus:ring-2 focus:ring-clay/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">Campaign sources</span>
                <input
                  type="text"
                  value={sourcesText}
                  onChange={(event) => setSourcesText(event.target.value)}
                  className="h-10 rounded-lg border border-line bg-bg/45 px-3 text-sm text-fg outline-none transition-colors focus:border-clay/50 focus:ring-2 focus:ring-clay/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">Accent</span>
                <input
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-10 w-20 cursor-pointer rounded-lg border border-line bg-bg p-1"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-fg">
              <input
                type="checkbox"
                checked={adPlatform}
                onChange={(event) => setAdPlatform(event.target.checked)}
                className="h-4 w-4 rounded border-line accent-[var(--color-clay,#d9481e)]"
              />
              Paid ad platform — show this group in Spending → Automation
            </label>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {sourcePreview.length > 0 && (
                <div className="flex min-h-10 flex-1 flex-wrap items-center gap-2 rounded-lg border border-line bg-bg/35 px-3 py-2">
                  {sourcePreview.map((source) => (
                    <span
                      key={source}
                      className="rounded-md border border-line bg-bg/60 px-1.5 py-0.5 text-[0.65rem] uppercase text-fg"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editing ? <RiSaveLine className="h-4 w-4" /> : <RiAddLine className="h-4 w-4" />}
                {saving ? "Saving..." : editing ? "Update campaign group" : "Create campaign group"}
              </button>
            </div>

            {tagTargets.length > 0 && (
              <div className="grid gap-3 lg:grid-cols-2">
                {tagTargets.map((target) => (
                  <label key={target} className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-muted">{target} UTM tags</span>
                    <input
                      type="text"
                      value={utmTagsDraft[target] ?? ""}
                      onChange={(event) =>
                        setUtmTagsDraft((current) => ({
                          ...current,
                          [target]: event.target.value,
                        }))
                      }
                      className="h-10 rounded-lg border border-line bg-bg/45 px-3 text-sm text-fg outline-none transition-colors focus:border-clay/50 focus:ring-2 focus:ring-clay/20"
                    />
                  </label>
                ))}
              </div>
            )}
          </form>
        </section>
      )}

      <section className="rounded-lg border border-line bg-surface shadow-soft">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">Campaign groups</h2>
          <p className="mt-1 text-xs text-muted">
            These groups power lead filters and spend charts.
          </p>
        </div>
        <div className="divide-y divide-line">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">No campaign groups found.</div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="p-4 transition-colors hover:bg-bg/45">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-fg">{category.name}</span>
                      {category.adPlatform && (
                        <span className="rounded-md bg-clay/10 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-clay">
                          Paid Ad platform
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(category.subcategories.length > 0
                        ? category.subcategories
                        : [category.name]
                      ).map((source) => (
                        <span
                          key={source}
                          className="rounded-md border border-line bg-bg/60 px-1.5 py-0.5 text-[0.65rem] uppercase text-fg"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                    {Object.keys(category.utmTags ?? {}).length > 0 && (
                      <div className="mt-3 grid gap-1.5 text-xs text-muted">
                        {Object.entries(category.utmTags).map(([target, tags]) => (
                          <div key={target}>
                            <span className="font-semibold text-fg/75">{target}</span>:{" "}
                            {tags.join(", ")}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="rounded-lg border border-line bg-bg p-1">
                      <div
                        className="h-5 w-8 rounded-md"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    {canManage && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-fg"
                          aria-label={`Edit ${category.name}`}
                        >
                          <RiEditLine className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteDialog(category)}
                          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted transition-colors hover:bg-clay/10 hover:text-clay"
                          aria-label={`Delete ${category.name}`}
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete campaign group"
          destructive
          confirmLabel="Delete group"
          message={
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-fg">{deleteTarget.name}</span>? Spending logs for
              this group will remain in history.
            </>
          }
          onConfirm={performDelete}
          onClose={() => setDeleteTarget(null)}
        >
          {affectedLeadIds.length === 0 ? (
            <p className="text-xs text-muted">No leads are currently attributed to this group.</p>
          ) : canDeleteLeads ? (
            <label className="flex items-start gap-2 rounded-lg border border-line bg-bg/40 px-3 py-2.5 text-sm text-fg">
              <input
                type="checkbox"
                checked={alsoDeleteLeads}
                onChange={(event) => setAlsoDeleteLeads(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-clay"
              />
              <span>
                Also delete the {affectedLeadIds.length} lead
                {affectedLeadIds.length === 1 ? "" : "s"} attributed to this group.
                <span className="mt-0.5 block text-xs text-muted">
                  Leave unchecked to keep them — they’ll move to “Unassigned”.
                </span>
              </span>
            </label>
          ) : (
            <p className="text-xs text-muted">
              {affectedLeadIds.length} lead{affectedLeadIds.length === 1 ? "" : "s"} will move to
              “Unassigned”.
            </p>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
