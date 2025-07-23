import { createSlice } from '@reduxjs/toolkit';
import { TeamMember, TeamMemberResponse, TeamState } from '../../types/teams';
import {
  fetchTeamMembers,
  fetchTeamInvites,
  inviteUser,
  removeUser,
  resendInvite,
} from './teamsThunks';

const initialState: TeamState & {
  membersPage: number;
  membersHasMore: boolean;
  membersLoading: boolean;
  membersSearch: string;
  invitesPage: number;
  invitesHasMore: boolean;
  invitesTotalCount: number;
  membersTotalCount: number;
} = {
  members: [],
  invites: [],
  invitesPage: 1,
  invitesHasMore: true,
  invitesTotalCount: 0,
  loading: false,
  error: null,
  membersPage: 1,
  membersHasMore: true,
  membersLoading: false,
  membersSearch: '',
  membersTotalCount: 0,
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setMembersSearch(state, action) {
      state.membersSearch = action.payload;
      state.members = [];
      state.membersPage = 1;
      state.membersHasMore = true;
    },
    resetMembers(state) {
      state.members = [];
      state.membersPage = 1;
      state.membersHasMore = true;
    },
    resetInvites(state) {
      state.invites = [];
      state.invitesPage = 1;
      state.invitesHasMore = true;
      state.invitesTotalCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTeamMembers.pending, (state) => {
      state.membersLoading = true;
    });
    builder.addCase(fetchTeamMembers.fulfilled, (state, action) => {
      const payload = action.payload;
      if (state.membersPage === 1) {
        // New search or initial load
        state.members = payload.members;
        state.membersPage = 2;
        state.membersHasMore = payload.hasMore;
        state.membersTotalCount = payload.totalCount;
      } else {
        // Append
        state.members = [...state.members, ...payload.members];
        state.membersPage += 1;
        state.membersHasMore = payload.hasMore;
        state.membersTotalCount = payload.totalCount;
      }
      state.membersLoading = false;
    });
    builder.addCase(fetchTeamMembers.rejected, (state, action) => {
      state.membersLoading = false;
      state.error = action.error.message || 'Failed to fetch team members';
    });
    builder.addCase(fetchTeamInvites.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchTeamInvites.fulfilled, (state, { payload }) => {
      const { invites, hasMore, totalCount, page } = payload;

      state.invites = page === 1 ? invites : [...state.invites, ...invites];
      state.invitesPage = page + 1;
      state.invitesHasMore = hasMore;
      state.invitesTotalCount = totalCount;
      state.loading = false;
    });
    builder.addCase(inviteUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(inviteUser.fulfilled, (state, action) => {
      state.invites.push(action.payload);
      state.loading = false;
    });
    builder.addCase(inviteUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to invite user';
    });
    builder.addCase(removeUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(removeUser.fulfilled, (state, action) => {
      state.members = state.members.filter((member) => member.id !== action.payload.id);
      state.loading = false;
    });
    builder.addCase(removeUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to remove user';
    });
    builder.addCase(resendInvite.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(resendInvite.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(resendInvite.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to resend invite';
    });
  },
});

export const { setMembersSearch, resetMembers, resetInvites } = teamsSlice.actions;
export default teamsSlice.reducer;
