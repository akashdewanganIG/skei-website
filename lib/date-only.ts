const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isValidDateOnly(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function todayDateOnly(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateOnly(value: unknown): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }
  if (typeof value !== "string") return null;

  const match = DATE_ONLY_RE.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidDateOnly(year, month, day)) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function dateOnlyToUtcDate(value: string): Date | null {
  const day = parseDateOnly(value);
  if (!day) return null;

  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

export function compareDateOnly(a: string, b: string): number {
  return a.localeCompare(b);
}

export function formatDateOnly(value: unknown, locale = "en-IN"): string {
  const day = parseDateOnly(value);
  if (!day) return "-";

  const date = dateOnlyToUtcDate(day);
  if (!date) return "-";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
