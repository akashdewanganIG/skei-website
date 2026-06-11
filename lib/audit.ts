import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { type AuditLogRow, auditLogs } from "@/lib/db/schema";

export type AuditLogSummary = {
  id: string;
  createdAt: string;
  actorUsername: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata: Record<string, unknown>;
};

type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

function toSummary(row: AuditLogRow): AuditLogSummary {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    actorUsername: row.actorUsername,
    actorName: row.actorName,
    actorRole: row.actorRole,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    summary: row.summary,
    metadata: row.metadata,
  };
}

/** Actor is a Session for user actions, or a synthetic identity for integrations. */
type AuditActor = { username: string; name: string; role: string };

export async function recordAuditLog(session: AuditActor, input: AuditInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorUsername: session.username,
      actorName: session.name,
      actorRole: session.role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? "",
      summary: input.summary,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
  }
}

export async function listAuditLogs(limit = 80): Promise<AuditLogSummary[]> {
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  return rows.map(toSummary);
}
