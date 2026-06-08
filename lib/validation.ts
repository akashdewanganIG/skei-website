export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

export function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getTrimmedString(body: Record<string, unknown>, key: string): string {
  return toTrimmedString(body[key]);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}

export function normalizeMobile(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidIndianMobile(value: string): boolean {
  return /^\d{10}$/.test(normalizeMobile(value));
}
