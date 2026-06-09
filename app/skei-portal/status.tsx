import type { LeadStatus } from "@/types/lead";

export const STATUS_ACCENT = "#d9481e";

/** Single accent for every pipeline status. */
export const STATUS_META: Record<LeadStatus, { color: string }> = {
  New: { color: STATUS_ACCENT },
  Contacted: { color: STATUS_ACCENT },
  "Visit Scheduled": { color: STATUS_ACCENT },
  Admitted: { color: STATUS_ACCENT },
  Closed: { color: STATUS_ACCENT },
};

/** Hex color with an alpha channel, e.g. hexA("#d9481e", 0.12). */
export function hexA(hex: string, alpha: number): string {
  const value = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${value}`;
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const { color } = STATUS_META[status] ?? STATUS_META.New;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold"
      style={{ color, backgroundColor: hexA(color, 0.12), borderColor: hexA(color, 0.28) }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}
