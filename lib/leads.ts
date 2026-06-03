import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/types/lead";

/**
 * Server-side bridge to the Google Apps Script that owns the leads sheet.
 * The shared secret never reaches the browser — these helpers run only on the
 * server (route handlers / server components).
 */

function getConfig() {
  const url = process.env.LEADS_SCRIPT_URL;
  const secret = process.env.LEADS_API_SECRET;
  if (!url || !secret) {
    throw new Error("LEADS_SCRIPT_URL and LEADS_API_SECRET must be set.");
  }
  return { url, secret };
}

function coerceStatus(value: unknown): LeadStatus {
  return LEAD_STATUSES.includes(value as LeadStatus) ? (value as LeadStatus) : "New";
}

function normalize(raw: Record<string, unknown>): Lead {
  const get = (key: string) => (raw[key] == null ? "" : String(raw[key]));
  return {
    id: get("id"),
    submit_date: get("submit_date"),
    student_name: get("student_name"),
    grade: get("grade"),
    dob: get("dob"),
    gender: get("gender"),
    parent_name: get("parent_name"),
    mobile_no: get("mobile_no"),
    email: get("email"),
    comment: get("comment"),
    status: coerceStatus(raw["status"]),
    remark: get("remark"),
    updated_at: get("updated_at"),
    updated_by: get("updated_by"),
  };
}

type ScriptResponse = {
  ok: boolean;
  error?: string;
  leads?: Record<string, unknown>[];
  lead?: Record<string, unknown>;
};

async function callScript(
  init: { method: "GET"; params: Record<string, string> } | { method: "POST"; body: object },
): Promise<ScriptResponse> {
  const { url, secret } = getConfig();
  let response: Response;

  if (init.method === "GET") {
    const query = new URLSearchParams({ ...init.params, secret });
    response = await fetch(`${url}?${query.toString()}`, { cache: "no-store" });
  } else {
    response = await fetch(url, {
      method: "POST",
      // text/plain avoids a CORS preflight on the Apps Script endpoint.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...init.body, secret }),
      cache: "no-store",
      redirect: "follow",
    });
  }

  if (!response.ok) {
    throw new Error(`Leads service returned ${response.status}.`);
  }

  const data = (await response.json()) as ScriptResponse;
  if (!data.ok) {
    throw new Error(data.error || "Leads service reported an error.");
  }
  return data;
}

export async function listLeads(): Promise<Lead[]> {
  const data = await callScript({ method: "GET", params: { action: "list" } });
  const leads = (data.leads ?? []).map(normalize);
  // Newest first by submit date, then by id as a stable tiebreaker.
  return leads.sort((a, b) => b.id.localeCompare(a.id));
}

export async function updateLead(
  id: string,
  patch: Partial<Omit<Lead, "id">>,
  updatedBy: string,
): Promise<Lead> {
  const data = await callScript({
    method: "POST",
    body: { action: "update", id, patch, updated_by: updatedBy },
  });
  if (!data.lead) throw new Error("Lead not found.");
  return normalize(data.lead);
}

export async function deleteLead(id: string): Promise<void> {
  await callScript({ method: "POST", body: { action: "delete", id } });
}
