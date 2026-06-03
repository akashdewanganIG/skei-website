import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listLeads } from "@/lib/leads";
import { Dashboard } from "./dashboard";
import type { Lead } from "@/types/lead";

export const metadata = { title: "Leads · SKEI Admin" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/skei-admin/login");

  let initialLeads: Lead[] = [];
  let loadError: string | null = null;
  try {
    initialLeads = await listLeads();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Could not reach the leads service.";
  }

  return <Dashboard session={session} initialLeads={initialLeads} loadError={loadError} />;
}
