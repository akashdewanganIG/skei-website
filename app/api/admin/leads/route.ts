import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listLeads } from "@/lib/leads";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const leads = await listLeads();
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Failed to list leads:", error);
    return NextResponse.json({ error: "Could not load leads." }, { status: 502 });
  }
}
