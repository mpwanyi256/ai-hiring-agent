export enum JobPermissionLevel {
  VIEWER = 'viewer',
  INTERVIEWER = 'interviewer',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export interface JobPermission {
  id: string;
  job_id: string;
  user_id: string;
  permission_level: JobPermissionLevel;
  granted_by: string;
  granted_at: string;
  created_at: string;
  updated_at: string;
}

export interface JobPermissionDetailed extends JobPermission {
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  user_role: string;
  job_title: string;
  job_owner_id: string;
  granted_by_first_name: string;
  granted_by_last_name: string;
}

export interface GrantJobPermissionPayload {
  job_id: string;
  user_id: string;
  permission_level: JobPermissionLevel;
}

export interface GrantJobPermissionByEmailPayload {
  job_id: string;
  user_email: string;
  permission_level: JobPermissionLevel;
}

export interface UpdateJobPermissionPayload {
  permission_id: string;
  permission_level: JobPermissionLevel;
}

export interface JobPermissionsState {
  permissions: JobPermissionDetailed[];
  loading: boolean;
  error: string | null;
}
