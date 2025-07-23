import { createAsyncThunk } from '@reduxjs/toolkit';
import { InviteUserPayload, TeamInvite, TeamMember } from '../../types/teams';
import { apiUtils } from '../api';
import { APIResponse } from '@/types';
import { RootState } from '..';

export const fetchTeam = createAsyncThunk('teams/fetchTeam', async () => {
  const res =
    await apiUtils.get<APIResponse<{ members: TeamMember[]; invites: TeamInvite[] }>>('/api/teams');
  return res.data;
});

export const inviteUser = createAsyncThunk(
  'teams/inviteUser',
  async (inviteData: Omit<InviteUserPayload, 'companyId'>, { getState }) => {
    const { auth } = getState() as RootState;
    const { user } = auth;
    if (!user?.companyId) throw new Error('No company ID found');
    const res = await apiUtils.post<APIResponse<TeamInvite>>('/api/teams/invite', {
      ...inviteData,
      companyId: user.companyId,
      companyName: user.companyName,
    });
    return res.data;
  },
);

export const removeUser = createAsyncThunk('teams/removeUser', async (userId: string) => {
  const res = await apiUtils.post<APIResponse<TeamInvite>>('/api/teams/remove', { userId });
  return res.data;
});

export const resendInvite = createAsyncThunk('teams/resendInvite', async (inviteId: string) => {
  const res = await apiUtils.post<APIResponse<TeamInvite>>('/api/teams/resend', { inviteId });
  return res.data;
});
