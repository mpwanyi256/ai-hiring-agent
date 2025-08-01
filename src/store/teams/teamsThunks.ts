import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  InviteUserPayload,
  TeamInvite,
  TeamInviteResponse,
  TeamMember,
  TeamMemberResponse,
} from '../../types/teams';
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
  async (inviteData: Omit<InviteUserPayload, 'companyId'>, { getState, dispatch }) => {
    const { auth } = getState() as RootState;
    const { user } = auth;
    if (!user?.companyId) throw new Error('No company ID found');
    const res = await apiUtils.post<APIResponse<TeamInvite>>('/api/teams/invite', {
      ...inviteData,
      companyId: user.companyId,
      companyName: user.companyName,
    });

    dispatch(fetchTeamInvites({ companyId: user.companyId, page: 1 }));
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

// New: Paginated fetch for team members (with search)
export const fetchTeamMembers = createAsyncThunk<
  TeamMemberResponse,
  { companyId: string; page?: number; limit?: number; search?: string }
>(
  'teams/fetchTeamMembers',
  async ({
    companyId,
    page = 1,
    limit = 20,
    search = '',
  }: {
    companyId: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const res = await apiUtils.get<APIResponse<TeamMemberResponse>>(
      `/api/teams/members?companyId=${companyId}&page=${page}&limit=${limit}${searchParam}`,
    );
    return res.data;
  },
);

// New: Paginated fetch for team invites
export const fetchTeamInvites = createAsyncThunk<
  TeamInviteResponse,
  { companyId: string; page?: number; limit?: number }
>('teams/fetchTeamInvites', async ({ companyId, page = 1, limit = 20 }) => {
  const res = await apiUtils.get<APIResponse<TeamInviteResponse>>(
    `/api/teams/invites?companyId=${companyId}&page=${page}&limit=${limit}`,
  );
  return res.data;
});
