export type LeadIdentity = {
  student_name?: string;
  parent_name?: string;
  mobile_no?: string;
};

function normalizeIdentityText(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeIdentityMobile(value: string): string {
  const digits = value.replace(/\D/g, "");

  // Treat common Indian country/trunk prefixes as the same local number. This
  // also lets older leads compare correctly with newly normalized imports.
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/**
 * Return the stable identity used to detect duplicate imported leads.
 *
 * Status, grade, email, comments and attribution are deliberately excluded:
 * they can change without making the person a new lead. Student name remains
 * part of the key so siblings sharing a parent's mobile can both be imported.
 */
export function leadImportDuplicateKey(lead: LeadIdentity): string {
  return [
    normalizeIdentityText(lead.student_name ?? ""),
    normalizeIdentityText(lead.parent_name ?? ""),
    normalizeIdentityMobile(lead.mobile_no ?? ""),
  ].join("\x00");
}

/** Remove leads already stored or repeated earlier in the same uploaded file. */
export function excludeDuplicateLeadImports<T extends LeadIdentity>(
  rows: readonly T[],
  existingLeads: readonly LeadIdentity[],
): { rows: T[]; duplicateCount: number } {
  const seen = new Set(existingLeads.map(leadImportDuplicateKey));
  const uniqueRows: T[] = [];
  let duplicateCount = 0;

  for (const row of rows) {
    const key = leadImportDuplicateKey(row);
    if (seen.has(key)) {
      duplicateCount++;
      continue;
    }

    seen.add(key);
    uniqueRows.push(row);
  }

  return { rows: uniqueRows, duplicateCount };
}
