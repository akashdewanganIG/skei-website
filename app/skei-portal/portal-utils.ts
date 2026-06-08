import type { Lead } from "@/types/lead";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function toCsv(leads: Lead[]): string {
  const columns: (keyof Lead)[] = [
    "submit_date",
    "student_name",
    "grade",
    "dob",
    "gender",
    "parent_name",
    "mobile_no",
    "email",
    "source",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "referrer",
    "comment",
    "status",
    "remark",
    "updated_by",
    "updated_at",
  ];
  const esc = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = columns.join(",");
  const rows = leads.map((lead) => columns.map((c) => esc(String(lead[c] ?? ""))).join(","));
  return [header, ...rows].join("\r\n");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function pct(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatLogTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function shortId(value: string): string {
  if (value.length <= 10) return value;
  return `${value.slice(0, 8)}...`;
}
