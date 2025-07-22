import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchTeamStart,
  fetchTeamSuccess,
  fetchTeamFailure,
  inviteUserStart,
  inviteUserSuccess,
  inviteUserFailure,
  removeUserStart,
  removeUserSuccess,
  removeUserFailure,
  resendInviteStart,
  resendInviteSuccess,
  resendInviteFailure,
} from './teamsSlice';
import { TeamInvite, TeamMember } from '../../types/teams';

// Fetch team members and invites
export const fetchTeam = () => async (dispatch: any) => {
  dispatch(fetchTeamStart());
  try {
    // TODO: Replace with real API call
    const res = await fetch('/api/teams');
    const data = await res.json();
    dispatch(
      fetchTeamSuccess({
        members: data.members as TeamMember[],
        invites: data.invites as TeamInvite[],
      }),
    );
  } catch (err: any) {
    dispatch(fetchTeamFailure(err.message));
  }
};

// Invite a new user
export const inviteUser =
  (inviteData: Omit<TeamInvite, 'id' | 'status' | 'expiresAt' | 'createdAt'>) =>
  async (dispatch: any) => {
    dispatch(inviteUserStart());
    try {
      // TODO: Replace with real API call
      const res = await fetch('/api/teams/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData),
      });
      const data = await res.json();
      dispatch(inviteUserSuccess(data as TeamInvite));
    } catch (err: any) {
      dispatch(inviteUserFailure(err.message));
    }
  };

// Remove a user
export const removeUser = (userId: string) => async (dispatch: any) => {
  dispatch(removeUserStart());
  try {
    // TODO: Replace with real API call
    await fetch(`/api/teams/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    dispatch(removeUserSuccess(userId));
  } catch (err: any) {
    dispatch(removeUserFailure(err.message));
  }
};

// Resend invite
export const resendInvite = (inviteId: string) => async (dispatch: any) => {
  dispatch(resendInviteStart());
  try {
    // TODO: Replace with real API call
    const res = await fetch(`/api/teams/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    });
    const data = await res.json();
    dispatch(resendInviteSuccess(data as TeamInvite));
  } catch (err: any) {
    dispatch(resendInviteFailure(err.message));
  }
};
