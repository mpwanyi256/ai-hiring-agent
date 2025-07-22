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
  firstName: string;
  lastName: string;
  role: TeamRole;
  status: 'active' | 'inactive';
  invitedAt?: string;
  joinedAt?: string;
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
