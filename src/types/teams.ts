// Team roles
export type TeamRole = 'admin' | 'employee' | 'recruiter' | 'developer';

// Invitation status
export enum InvitationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
}
export type InvitationStatusType = keyof typeof InvitationStatus;

// Team member (user)
export interface TeamMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: TeamRole;
  created_at: string;
}

export interface TeamMemberResponse {
  members: TeamMember[];
  hasMore: boolean;
  totalCount: number;
}

// Team invite
export interface TeamInvite {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  role: TeamRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

// State for the teams slice
export interface TeamState {
  members: TeamMember[];
  invites: TeamInvite[];
  loading: boolean;
  error: string | null;
}

export interface InviteUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: TeamRole;
  companyId: string;
}

export const ROLES: { label: string; value: TeamRole }[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Employee', value: 'employee' },
  { label: 'Recruiter', value: 'recruiter' },
  { label: 'Developer', value: 'developer' },
];
