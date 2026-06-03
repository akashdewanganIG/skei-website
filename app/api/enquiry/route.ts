import { NextResponse } from "next/server";
import { createLead } from "@/lib/leads";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const str = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");
  const input = {
    student_name: str("student_name"),
    grade: str("grade"),
    dob: str("dob"),
    gender: str("gender"),
    parent_name: str("parent_name"),
    mobile_no: str("mobile_no"),
    email: str("email"),
    comment: str("comment").slice(0, 2000),
  };

  // Mirror the form's required fields (email & comment are optional).
  if (
    input.student_name.length < 2 ||
    !input.grade ||
    !input.dob ||
    !input.gender ||
    input.parent_name.length < 2 ||
    !/^\d{10}$/.test(input.mobile_no.replace(/\D/g, "")) ||
    (input.email && !EMAIL_RE.test(input.email))
  ) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  try {
    await createLead(input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to save enquiry:", error);
    return NextResponse.json({ error: "Could not submit enquiry." }, { status: 500 });
  }
}
