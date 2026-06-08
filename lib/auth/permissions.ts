import {
  ADMIN_PERMISSIONS,
  type AdminPermission,
  type Role,
  type Session,
  STAFF_DEFAULT_PERMISSIONS,
} from "@/types/lead";

const PERMISSION_SET = new Set<AdminPermission>(ADMIN_PERMISSIONS);

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  view_leads: "View leads",
  edit_remarks: "Edit remarks",
  edit_leads: "Edit lead details",
  manage_status: "Manage lead status",
  delete_leads: "Delete leads",
  export_leads: "Export CSV",
  view_analytics: "View analytics",
  view_campaigns: "View campaigns",
  manage_campaigns: "Manage campaigns",
  view_spending: "View spending",
  manage_spending: "Manage spending",
  view_logs: "View logs",
  manage_users: "Manage users",
};

export function defaultPermissionsForRole(role: Role): AdminPermission[] {
  return role === "admin" ? [...ADMIN_PERMISSIONS] : [...STAFF_DEFAULT_PERMISSIONS];
}

export function normalizePermissions(role: Role, permissions: unknown): AdminPermission[] {
  if (role === "admin") return defaultPermissionsForRole(role);
  if (!Array.isArray(permissions)) return defaultPermissionsForRole(role);

  const selected = permissions.filter(
    (permission): permission is AdminPermission =>
      typeof permission === "string" &&
      PERMISSION_SET.has(permission as AdminPermission) &&
      permission !== "manage_users",
  );
  return Array.from(new Set(selected));
}

export function hasPermission(session: Session, permission: AdminPermission): boolean {
  return session.role === "admin" || session.permissions.includes(permission);
}

export function canManageUsers(session: Session): boolean {
  return session.role === "admin";
}
