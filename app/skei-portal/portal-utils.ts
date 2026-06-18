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

type LeadExportColumn = {
  key: keyof Lead;
  /** Human-friendly header shown in the spreadsheet. */
  header: string;
  /** Excel column width (in character units). */
  width: number;
  /**
   * Force the cell to text so Excel keeps the value verbatim instead of
   * collapsing it to scientific notation (e.g. 9E+12 for phone numbers) or
   * rendering #### for values it guesses are dates.
   */
  text?: boolean;
};

/** Column order, friendly headers and widths used for lead exports. */
const LEAD_EXPORT_COLUMNS: LeadExportColumn[] = [
  { key: "submit_date", header: "Submit Date", width: 20, text: true },
  { key: "student_name", header: "Student Name", width: 24 },
  { key: "grade", header: "Grade", width: 12 },
  { key: "dob", header: "DOB", width: 14, text: true },
  { key: "gender", header: "Gender", width: 12 },
  { key: "parent_name", header: "Parent Name", width: 24 },
  { key: "mobile_no", header: "Mobile No", width: 18, text: true },
  { key: "email", header: "Email", width: 30 },
  { key: "source", header: "Source", width: 16 },
  { key: "utm_source", header: "UTM Source", width: 16 },
  { key: "utm_medium", header: "UTM Medium", width: 16 },
  { key: "utm_campaign", header: "UTM Campaign", width: 20 },
  { key: "utm_term", header: "UTM Term", width: 16 },
  { key: "utm_content", header: "UTM Content", width: 18 },
  { key: "referrer", header: "Referrer", width: 26 },
  { key: "comment", header: "Comment", width: 32 },
  { key: "status", header: "Status", width: 16 },
  { key: "remark", header: "Remark", width: 32 },
  { key: "updated_by", header: "Updated By", width: 18 },
  { key: "updated_at", header: "Updated At", width: 20, text: true },
];

export const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Coerce any ExcelJS cell value into a trimmed plain string. */
function cellToText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (typeof v.text === "string") return v.text.trim();
    if (Array.isArray(v.richText)) {
      return v.richText
        .map((part) => (part as { text?: string })?.text ?? "")
        .join("")
        .trim();
    }
    if ("result" in v) return cellToText(v.result);
    if (typeof v.hyperlink === "string") return v.hyperlink.trim();
  }
  return String(value).trim();
}

/**
 * Build a styled .xlsx workbook for the given leads and return it as a Blob.
 * Headers are human-friendly, columns are pre-sized, and date / phone columns
 * are written as text so Excel never renders them as #### or 9E+12.
 */
export async function leadsToXlsxBlob(leads: Lead[]): Promise<Blob> {
  const ExcelJS = await import("exceljs");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SKEI Portal";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Leads", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  });

  sheet.columns = LEAD_EXPORT_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key as string,
    width: col.width,
    style: {
      alignment: { vertical: "middle", horizontal: "left" },
      ...(col.text ? { numFmt: "@" } : {}),
    },
  }));

  // Style the header row: bold white text on the clay accent, with a filter.
  const headerRow = sheet.getRow(1);
  headerRow.height = 24;
  headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB4532A" },
    };
    cell.border = { bottom: { style: "thin", color: { argb: "FF7A3318" } } };
  });

  for (const lead of leads) {
    const record: Record<string, string> = {};
    for (const col of LEAD_EXPORT_COLUMNS) {
      record[col.key as string] = String(lead[col.key] ?? "");
    }
    sheet.addRow(record);
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: LEAD_EXPORT_COLUMNS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: XLSX_MIME_TYPE });
}

/* -------------------------------------------------------------------------- */
/*  Smart lead import                                                          */
/* -------------------------------------------------------------------------- */

export type ImportColumn = { key: string; label: string };

/**
 * Canonical fields we import into. Whatever the uploaded file calls its
 * columns (and in whatever order), we map them onto these keys. They match the
 * keys the import API reads.
 */
export const LEAD_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "student_name", label: "Student Name" },
  { key: "grade", label: "Grade" },
  { key: "dob", label: "DOB" },
  { key: "gender", label: "Gender" },
  { key: "parent_name", label: "Parent Name" },
  { key: "mobile_no", label: "Mobile No" },
  { key: "email", label: "Email" },
  { key: "comment", label: "Comment" },
];

/** Known header spellings for each canonical field (snake_case, lowercased). */
const IMPORT_FIELD_ALIASES: Record<string, string[]> = {
  student_name: ["student_name", "student", "name", "child_name", "applicant_name", "full_name"],
  grade: ["grade", "class", "standard", "std", "grade_applied", "grade_applying_for", "course"],
  dob: ["dob", "date_of_birth", "birth_date", "birthdate", "d_o_b"],
  gender: ["gender", "sex"],
  parent_name: ["parent_name", "parent", "guardian", "guardian_name", "father_name", "mother_name", "parents_name"],
  mobile_no: ["mobile_no", "mobile", "mobile_number", "phone", "phone_no", "phone_number", "contact", "contact_no", "contact_number", "whatsapp", "cell"],
  email: ["email", "email_id", "email_address", "e_mail", "mail"],
  comment: ["comment", "comments", "message", "enquiry", "enquiry_message", "note", "notes", "query"],
};

/** Lowercase a header into a comparable token, e.g. "Date of Birth" -> "date_of_birth". */
function normalizeHeaderToken(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Reverse map: normalized header token -> canonical key. */
const ALIAS_LOOKUP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [key, aliases] of Object.entries(IMPORT_FIELD_ALIASES)) {
    map[key] = key;
    for (const alias of aliases) map[normalizeHeaderToken(alias)] = key;
  }
  return map;
})();

/** Pick the most likely column delimiter from a header line. */
function detectDelimiter(line: string): string | null {
  const counts: Record<string, number> = { ";": 0, "\t": 0, ",": 0 };
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && ch in counts) counts[ch]++;
  }
  const best = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
}

/** RFC-4180-ish parser that handles quoted fields, escaped quotes and newlines. */
function parseDelimited(input: string, delimiter: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input; // strip BOM
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === delimiter) { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Map a "1"/"2"/"m"/"f" style gender into a readable label. */
function normalizeGender(value: string): string {
  const s = value.trim().toLowerCase();
  if (s === "1" || s === "m" || s === "male") return "Male";
  if (s === "2" || s === "f" || s === "female") return "Female";
  if (s === "3" || s === "o" || s === "other" || s === "others") return "Other";
  return value.trim();
}

/** Reduce an ISO / datetime string to a plain YYYY-MM-DD date. */
function normalizeDateOnly(value: string): string {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ]|$)/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : value.trim();
}

/**
 * Reduce a phone number to its local 10-digit form so it passes import
 * validation: keep digits only, then drop a leading Indian 91 country code
 * (12 digits) or a trunk 0 (11 digits). Other lengths are left as-is so a
 * genuinely malformed number is still flagged rather than silently "fixed".
 */
function normalizeMobileNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/** Clean a single raw cell for a given canonical field. */
function cleanImportValue(key: string, raw: string): string {
  let v = raw.trim();
  if (v.toUpperCase() === "NULL") v = "";
  if (!v) return "";
  if (key === "gender") return normalizeGender(v);
  if (key === "dob") return normalizeDateOnly(v);
  if (key === "mobile_no") return normalizeMobileNumber(v);
  return v;
}

/**
 * Some exports cram an entire delimited row into a single spreadsheet column —
 * this happens when a semicolon/tab CSV is opened in Excel as a comma file: the
 * real delimiter keeps the row in column A, but stray commas (inside comments)
 * spill the tail into columns B, C, … To recover the original row we rejoin the
 * cells with a comma (the char Excel split on) and then split on the real
 * delimiter detected from the header.
 */
function uncramGrid(grid: string[][]): string[][] {
  const header = grid[0] ?? [];
  const nonEmpty = header.filter((h) => h.trim()).length;
  const delimiter = detectDelimiter(header[0] ?? "");
  if (nonEmpty <= 1 && delimiter && delimiter !== ",") {
    return grid.map((row) => {
      let last = row.length - 1;
      while (last >= 0 && !row[last].trim()) last--;
      const line = row.slice(0, last + 1).join(",");
      return parseDelimited(line, delimiter)[0] ?? [];
    });
  }
  return grid;
}

/** Turn a header+rows grid into records keyed by our canonical fields. */
function gridToImportRecords(grid: string[][]): Record<string, string>[] {
  if (grid.length < 2) return [];
  const header = grid[0];
  const colKeys = header.map((h) => ALIAS_LOOKUP[normalizeHeaderToken(h)] ?? null);

  const records: Record<string, string>[] = [];
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    const record: Record<string, string> = {};
    for (const col of LEAD_IMPORT_COLUMNS) record[col.key] = "";

    let hasValue = false;
    for (let c = 0; c < colKeys.length; c++) {
      const key = colKeys[c];
      if (!key) continue;
      const value = cleanImportValue(key, cells[c] ?? "");
      if (value) {
        record[key] = value;
        hasValue = true;
      }
    }
    if (hasValue) records.push(record);
  }
  return records;
}

/** Read the first worksheet of an .xlsx into a grid of plain-string cells. */
async function readXlsxGrid(data: ArrayBuffer): Promise<string[][]> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    data as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const grid: string[][] = [];
  const colCount = Math.max(1, sheet.columnCount);
  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const cells: string[] = [];
    for (let c = 1; c <= colCount; c++) cells.push(cellToText(row.getCell(c).value));
    grid.push(cells);
  }
  return grid;
}

/**
 * Parse an uploaded leads file (.xlsx or delimited text) into records keyed by
 * our canonical fields. Handles any column order, alternate header names,
 * comma/semicolon/tab delimiters and single-column "crammed" exports.
 */
export async function parseLeadsFile(file: File): Promise<Record<string, string>[]> {
  const name = file.name.toLowerCase();
  const isXlsx = name.endsWith(".xlsx") || file.type === XLSX_MIME_TYPE;

  let grid: string[][];
  if (isXlsx) {
    grid = uncramGrid(await readXlsxGrid(await file.arrayBuffer()));
  } else {
    const text = await file.text();
    const firstLine = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
    const delimiter = detectDelimiter(firstLine) ?? ",";
    grid = parseDelimited(text, delimiter);
  }
  return gridToImportRecords(grid);
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
