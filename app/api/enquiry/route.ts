import { after, NextResponse } from "next/server";
import { inferSourceFromAttribution } from "@/lib/campaign-attribution";
import { listCampaignCategories } from "@/lib/campaigns";
import { mirrorLeadToSheet } from "@/lib/google-sheets";
import { createLead } from "@/lib/leads";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import { getTrimmedString, isValidEmail, isValidIndianMobile } from "@/lib/validation";
import type { Lead } from "@/types/lead";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const input = {
    student_name: getTrimmedString(body, "student_name"),
    grade: getTrimmedString(body, "grade"),
    dob: getTrimmedString(body, "dob"),
    gender: getTrimmedString(body, "gender"),
    parent_name: getTrimmedString(body, "parent_name"),
    mobile_no: getTrimmedString(body, "mobile_no"),
    email: getTrimmedString(body, "email"),
    attribution_source: getTrimmedString(body, "source").slice(0, 180),
    utm_source: getTrimmedString(body, "utm_source").slice(0, 180),
    utm_medium: getTrimmedString(body, "utm_medium").slice(0, 180),
    utm_campaign: getTrimmedString(body, "utm_campaign").slice(0, 180),
    utm_term: getTrimmedString(body, "utm_term").slice(0, 180),
    utm_content: getTrimmedString(body, "utm_content").slice(0, 180),
    referrer: getTrimmedString(body, "referrer").slice(0, 500),
  };

  const missing = [];
  if (input.student_name.length < 2) missing.push("Student name");
  if (!input.grade) missing.push("Grade");
  if (!input.dob) missing.push("Date of birth");
  if (!input.gender) missing.push("Gender");
  if (input.parent_name.length < 2) missing.push("Parent name");
  if (!isValidIndianMobile(input.mobile_no)) missing.push("Valid 10-digit mobile number");
  if (input.email && !isValidEmail(input.email)) missing.push("Valid email");

  if (missing.length > 0) {
    const message = missing.length === 1 
      ? `${missing[0]} is required.`
      : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]} are required.`;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const recaptcha = await verifyRecaptchaToken(getTrimmedString(body, "recaptchaToken"), remoteIp);
  if (!recaptcha.ok) {
    return NextResponse.json({ error: recaptcha.error }, { status: recaptcha.status });
  }

  let lead: Lead;
  try {
    const categories = await listCampaignCategories();
    const source = inferSourceFromAttribution(
      {
        source: input.attribution_source,
        utmSource: input.utm_source,
        utmMedium: input.utm_medium,
        utmCampaign: input.utm_campaign,
        utmTerm: input.utm_term,
        utmContent: input.utm_content,
        referrer: input.referrer,
      },
      categories,
    );

    lead = await createLead({
      ...input,
      source: source.name,
      utm_source: input.utm_source,
      utm_medium: input.utm_medium,
      utm_campaign: input.utm_campaign,
      utm_term: input.utm_term,
      utm_content: input.utm_content,
      referrer: input.referrer,
    });
  } catch (error) {
    console.error("Failed to save enquiry:", error);
    return NextResponse.json({ error: "Could not submit enquiry." }, { status: 500 });
  }

  // Secondary copy into the shared SKEI Google Sheet, deferred until after the
  // response is flushed. Awaiting it here would add the Apps Script round trip
  // to every submission and, on a hanging script, could push this request past
  // the platform's function timeout — turning a lead that was already saved
  // into a visible error and inviting a duplicate resubmission. The lead is
  // committed by this point and mirrorLeadToSheet never throws, so the mirror
  // can only ever succeed quietly or log.
  after(() => mirrorLeadToSheet(lead));

  return NextResponse.json({ ok: true }, { status: 201 });
}
