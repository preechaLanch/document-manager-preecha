export type Role = "User" | "Accountant" | "Manager" | "Admin";

export interface IStatusConfig {
  label: string;
  color: string;
}

export interface IStage {
  name: string;
  color: string;
}

export interface IDocument {
  document_id: string;
  document_no: string;
  document_type: string;
  description: string;
  current_status: string;
  from_status?: string;
  created_by: string;
  created_at: string;
  owner: string;
}

export interface IHistory {
  id: string;
  document_id: string;
  from_status: string;
  to_status: string;
  action: string;
  action_by: string;
  action_at: string;
  comment: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
}
