import type { CampaignCategory, CampaignSourceName } from "@/lib/campaign-attribution";
import type { AdminPermission, LeadStatus, Role } from "@/types/lead";

export type View =
  | "overview"
  | "analytics"
  | "leads"
  | "users"
  | "logs"
  | "campaigns"
  | "spending"
  | "account";
export type Filter = "all" | LeadStatus;
export type LeadSection = "all" | "active" | "enrolled" | "not_converted" | "new";
export type SelectOption<T extends string = string> = { value: T; label: string };
export type { CampaignCategory };

export type AdminUserSummary = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  permissions: AdminPermission[];
  createdAt: string;
  emailVerifiedAt: string;
  lastLoginAt: string;
};

export type UserDraft = {
  username: string;
  name: string;
  email: string;
  role: Role;
  permissions: AdminPermission[];
  password: string;
};

export type ManualLeadDraft = {
  student_name: string;
  grade: string;
  dob: string;
  gender: string;
  parent_name: string;
  mobile_no: string;
  email: string;
  source: CampaignSourceName;
  status: LeadStatus;
  comment: string;
  remark: string;
};

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

export type SpendLog = {
  id: string;
  source: string;
  amount: string;
  date: string;
  createdAt: string;
  addedBy: string;
};
