export type Role = "admin" | "staff";

export const ADMIN_PERMISSIONS = [
  "view_leads",
  "edit_remarks",
  "edit_leads",
  "manage_status",
  "delete_leads",
  "export_leads",
  "view_analytics",
  "view_campaigns",
  "manage_campaigns",
  "view_spending",
  "manage_spending",
  "view_logs",
  "manage_users",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const STAFF_DEFAULT_PERMISSIONS: AdminPermission[] = [
  "view_leads",
  "edit_remarks",
  "view_analytics",
];

export type Session = {
  username: string;
  email: string;
  role: Role;
  name: string;
  permissions: AdminPermission[];
};

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Visit Scheduled",
  "Admitted",
  "Closed",
  "Junk",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type Lead = {
  id: string;
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
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  referrer: string;
  status: LeadStatus;
  remark: string;
  updated_at: string;
  updated_by: string;
};

/** Fields an admin may correct directly on a lead. */
export const EDITABLE_LEAD_FIELDS = [
  "student_name",
  "grade",
  "dob",
  "gender",
  "parent_name",
  "mobile_no",
  "email",
  "comment",
] as const;

export type EditableLeadField = (typeof EDITABLE_LEAD_FIELDS)[number];
