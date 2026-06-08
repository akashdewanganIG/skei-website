import {
  ADMIN_PERMISSIONS,
  type AdminPermission,
  LEAD_STATUSES,
  type LeadStatus,
  type Role,
} from "@/types/lead";
import type { Filter, LeadSection, ManualLeadDraft, SelectOption, UserDraft } from "./portal-types";

export const ORANGE_ACCENT = "#d9481e";

export const LEAD_SECTIONS: {
  key: LeadSection;
  label: string;
  statuses: LeadStatus[] | null;
}[] = [
  { key: "all", label: "Main leads", statuses: null },
  { key: "active", label: "Follow-up", statuses: ["Contacted", "Visit Scheduled"] },
  { key: "enrolled", label: "Enrolled batch", statuses: ["Admitted"] },
  { key: "not_converted", label: "Not converted", statuses: ["Closed"] },
  { key: "new", label: "New enquiries", statuses: ["New"] },
];

export const EMPTY_USER_FORM: UserDraft = {
  username: "",
  name: "",
  email: "",
  role: "staff",
  permissions: ["view_leads", "edit_remarks", "view_analytics"],
  password: "",
};

export const EMPTY_LEAD_FORM: ManualLeadDraft = {
  student_name: "",
  grade: "",
  dob: "",
  gender: "",
  parent_name: "",
  mobile_no: "",
  email: "",
  source: "",
  status: "New",
  comment: "",
  remark: "",
};

export const MANAGED_PERMISSIONS: AdminPermission[] = ADMIN_PERMISSIONS.filter(
  (permission) => permission !== "manage_users",
);

export const STATUS_FILTER_OPTIONS: SelectOption<Filter>[] = [
  { value: "all", label: "All status" },
  ...LEAD_STATUSES.map((status) => ({ value: status, label: status })),
];

export const LEAD_STATUS_OPTIONS: SelectOption<LeadStatus>[] = LEAD_STATUSES.map((status) => ({
  value: status,
  label: status,
}));

export const ROLE_OPTIONS: SelectOption<Role>[] = [
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];
