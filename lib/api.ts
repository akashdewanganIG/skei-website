export type EnquiryPayload = {
  student_name: string;
  grade: string;
  dob: string;
  gender: string;
  parent_name: string;
  mobile_no: string;
  email: string;
  comment: string;
  recaptchaToken: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
};

export async function submitEnquiry(payload: EnquiryPayload) {
  const res = await fetch("/api/enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Could not submit enquiry.");
  }

  return res;
}
