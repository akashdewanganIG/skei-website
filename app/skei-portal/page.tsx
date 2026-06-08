import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { listLeads } from "@/lib/leads";
import type { Lead } from "@/types/lead";
import { Dashboard } from "./dashboard";

export const metadata = { title: "Dashboard · SKEI Portal" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/skei-portal/login");

  let initialLeads: Lead[] = [];
  let loadError: string | null = null;
  if (hasPermission(session, "view_leads")) {
    try {
      initialLeads = await listLeads();
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Could not reach the leads service.";
    }
  } else {
    loadError = "Your account does not have permission to view leads";
  }

  return <Dashboard session={session} initialLeads={initialLeads} loadError={loadError} />;
}
