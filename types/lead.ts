export type Role = "admin" | "staff";

export type Session = {
  username: string;
  role: Role;
  name: string;
};

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Visit Scheduled",
  "Admitted",
  "Closed",
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
