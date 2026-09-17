import type { Lead } from "@/types/lead";

/**
 * Mirrors admission enquiries into the shared SKEI Google Sheet through the
 * existing Apps Script web app — the same /exec endpoint the older SKEI site
 * posts to, writing into the same spreadsheet and column layout.
 *
 * This is strictly a secondary copy. By the time we get here the lead is
 * already committed to Postgres, so every failure is logged and swallowed:
 * a Sheets outage must never turn a saved enquiry into an error for the
 * visitor. Nothing exported here is allowed to throw.
 */

/**
 * Value written to the sheet's trailing "Source / Website Identifier" column,
 * identifying which site a row came from. The older site writes its own
 * identifier into the same column.
 *
 * Unrelated to the campaign attribution `source` stored on the lead itself —
 * that stays in Postgres and never reaches the sheet.
 *
 * Update this if the site moves to a custom domain; it is the only place the
 * identifier is defined.
 */
export const SHEET_WEBSITE_ID = "skeischool.vercel.app";

/** Server-only Apps Script web app URL (…/macros/s/<deployment>/exec). */
const WEBAPP_URL_ENV = "GOOGLE_SHEETS_WEBAPP_URL";

/**
 * Cap on the Apps Script round trip. This never affects how long a visitor
 * waits — the mirror runs after the response is sent — but `after()` work is
 * still bounded by the route's max duration, which defaults to 10s on common
 * platforms. Keeping this comfortably under that leaves room for the request
 * work that precedes it, so a hanging script times out on our terms (and logs)
 * instead of being killed mid-write with nothing recorded. A real append takes
 * a second or two; raise this only alongside the route's `maxDuration`.
 */
const REQUEST_TIMEOUT_MS = 6_000;

/**
 * Payload the Apps Script reads, declared in sheet column order:
 * Submit Date, Student Name, Grade, Date of Birth, Gender, Parent Name,
 * Mobile Number, Email, Comment, Source.
 *
 * `comment` is always "" for this site, which has no comment field. It still
 * has to occupy its position so the Source column stays aligned with the rows
 * the older site writes.
 */
export type SheetLeadPayload = {
  submit_date: string;
  student_name: string;
  grade: string;
  dob: string;
  gender: string;
  parent_name: string;
  mobile_no: string;
  email: string;
  comment: string;
  source: string;
};

/**
 * Build the sheet payload from a freshly created lead.
 *
 * Key insertion order here is the sheet's column order, so `JSON.stringify`
 * serialises the fields in that order too. `submit_date` reuses the value
 * `createLead` already derived (dd-MM-yyyy in Asia/Kolkata), which keeps the
 * sheet, the portal and the database showing the same date for a lead.
 *
 * Gender is passed through verbatim. This site's form already submits readable
 * labels ("Male" / "Female") rather than numeric codes, so there is nothing to
 * normalise before the request.
 */
export function buildSheetLeadPayload(lead: Lead): SheetLeadPayload {
  return {
    submit_date: lead.submit_date,
    student_name: lead.student_name,
    grade: lead.grade,
    dob: lead.dob,
    gender: lead.gender,
    parent_name: lead.parent_name,
    mobile_no: lead.mobile_no,
    email: lead.email,
    // Deliberately blank, and deliberately still here: this site dropped its
    // comment field, but the older site still fills this column. Removing the
    // key would slide Source out of column J for our rows only.
    comment: "",
    source: SHEET_WEBSITE_ID,
  };
}

/**
 * An unset URL is a valid "mirror turned off" state, so it is noted once per
 * process rather than on every submission. A URL that is set but wrong is a
 * real misconfiguration and is logged every time, because it means rows are
 * silently missing from the sheet.
 */
let disabledNoticeShown = false;

/**
 * Resolve the configured endpoint, or null when it is unusable.
 *
 * Apps Script only accepts posts at the deployment's `/exec` URL, so a bare
 * deployment ID or a `/dev` URL is rejected up front with a clear log line
 * rather than failing opaquely on every submission.
 */
function resolveWebAppUrl(): string | null {
  const raw = process.env[WEBAPP_URL_ENV]?.trim();
  if (!raw) {
    if (!disabledNoticeShown) {
      disabledNoticeShown = true;
      console.warn(
        `[sheets] ${WEBAPP_URL_ENV} is not set — enquiries are saved to the database but not mirrored to the Google Sheet.`,
      );
    }
    return null;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    console.error(
      `[sheets] ${WEBAPP_URL_ENV} is not a valid URL. Expected the Apps Script web app URL ending in /exec.`,
    );
    return null;
  }

  if (url.protocol !== "https:" || !url.pathname.endsWith("/exec")) {
    console.error(
      `[sheets] ${WEBAPP_URL_ENV} must be the https Apps Script web app URL ending in /exec (not a deployment ID or a /dev URL). Got: ${url.origin}${url.pathname}`,
    );
    return null;
  }

  return url.toString();
}

/**
 * Apps Script answers a POST to /exec with a 302 to script.googleusercontent.com,
 * which serves the actual response body. `fetch` follows that automatically
 * (turning the hop into a GET, per the fetch spec) — the script's doPost has
 * already run and written the row by then, so the body is never re-sent.
 *
 * A deployment that is not shared with "Anyone" instead redirects to a Google
 * sign-in page and returns HTML, which is the most common silent failure here,
 * so it gets its own check.
 */
function describeLoginRedirect(finalUrl: string, body: string): string | null {
  const host = (() => {
    try {
      return new URL(finalUrl).host;
    } catch {
      return "";
    }
  })();

  if (host === "accounts.google.com" || body.includes("ServiceLogin")) {
    return 'the deployment redirected to a Google sign-in page — redeploy the web app with access set to "Anyone"';
  }
  return null;
}

/**
 * Post one lead to the shared sheet. Never throws and never rejects; the
 * outcome is reported through the return value and the logs only.
 */
export async function mirrorLeadToSheet(lead: Lead): Promise<{ ok: boolean; skipped?: boolean }> {
  try {
    const url = resolveWebAppUrl();
    if (!url) return { ok: false, skipped: true };

    const payload = buildSheetLeadPayload(lead);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    // Parse the whole body but only ever log a preview: truncating before
    // JSON.parse would make a long error message unparseable, and the lenient
    // catch below would then read a failed write as a success.
    const body = await response.text();
    const preview = body.slice(0, 500);

    if (!response.ok) {
      console.error(
        `[sheets] Apps Script returned ${response.status} for lead ${lead.id}. Response: ${preview}`,
      );
      return { ok: false };
    }

    const loginProblem = describeLoginRedirect(response.url, body);
    if (loginProblem) {
      console.error(`[sheets] Lead ${lead.id} was not written: ${loginProblem}.`);
      return { ok: false };
    }

    // The status code is not a reliable signal: the script's own catch block
    // answers HTTP 200 with {"success": false, "message": ...}, so a missing
    // tab or a parse error still arrives as a 200. The body decides.
    try {
      const parsed = JSON.parse(body) as {
        success?: boolean;
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (parsed.success === false || parsed.ok === false) {
        const reason = (parsed.message ?? parsed.error ?? "no reason given").slice(0, 500);
        console.error(`[sheets] Apps Script rejected lead ${lead.id}: ${reason}`);
        return { ok: false };
      }
    } catch {
      // A non-JSON 200 is tolerated; treat it as success rather than crying
      // wolf on a deployment that answers with plain text.
    }

    return { ok: true };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "TimeoutError"
        ? `no response within ${REQUEST_TIMEOUT_MS}ms`
        : error instanceof Error
          ? error.message
          : String(error);
    // Only the id is logged, never the row: this is a child's name, date of
    // birth and a parent's contact details, and it is already persisted in
    // Postgres under this id, so the id is enough to look the lead up and
    // replay it into the sheet by hand.
    console.error(`[sheets] Failed to mirror lead ${lead.id} (${reason}).`);
    return { ok: false };
  }
}
