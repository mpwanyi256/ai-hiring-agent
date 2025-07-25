export enum UserActivityEventType {
  // Team-related events
  TEAM_INVITE_SENT = 'team_invite_sent',
  TEAM_INVITE_ACCEPTED = 'team_invite_accepted',
  TEAM_INVITE_REJECTED = 'team_invite_rejected',
  TEAM_MEMBER_REMOVED = 'team_member_removed',

  // Job permission events
  JOB_PERMISSION_GRANTED = 'job_permission_granted',
  JOB_PERMISSION_UPDATED = 'job_permission_updated',
  JOB_PERMISSION_REVOKED = 'job_permission_revoked',

  // Existing events (for reference)
  CANDIDATE_APPLIED = 'candidate_applied',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  JOB_CREATED = 'job_created',
  EVALUATION_COMPLETED = 'evaluation_completed',
}

export enum UserActivityEntityType {
  INVITE = 'invite',
  JOB_PERMISSION = 'job_permission',
  PROFILE = 'profile',
  CANDIDATE = 'candidate',
  INTERVIEW = 'interview',
  JOB = 'job',
  EVALUATION = 'evaluation',
}

export interface UserActivity {
  id: string;
  user_id: string;
  event_type: UserActivityEventType;
  entity_id: string | null;
  entity_type: UserActivityEntityType | null;
  message: string;
  meta: Record<string, any> | null;
  created_at: string;
}

export interface TeamActivity extends UserActivity {
  user_name: string;
  user_email: string;
  company_id: string;
}

// Specific metadata types for different event types
export interface TeamInviteMetadata {
  invitee_email: string;
  invitee_name: string;
  role: string;
  company_id: string;
  expires_at?: string;
  accepted_at?: string;
  rejected_at?: string;
}

export interface JobPermissionMetadata {
  job_id: string;
  job_title: string;
  user_id: string;
  user_name: string;
  permission_level: string;
  granted_by_name?: string;
  updated_by_name?: string;
  revoked_by_name?: string;
  old_permission_level?: string;
  new_permission_level?: string;
}

export interface TeamMemberRemovedMetadata {
  removed_user_id: string;
  removed_user_name: string;
  removed_user_email: string;
  removed_user_role: string;
  company_id: string;
  removed_by_name: string;
}

export interface AuditLogState {
  activities: TeamActivity[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export interface FetchActivitiesPayload {
  companyId: string;
  page?: number;
  limit?: number;
  eventTypes?: UserActivityEventType[];
}
