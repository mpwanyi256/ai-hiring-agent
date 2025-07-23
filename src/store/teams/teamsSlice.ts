import { createSlice } from '@reduxjs/toolkit';
import { TeamMember, TeamState } from '../../types/teams';
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
} = {
  members: [],
  invites: [],
  loading: false,
  error: null,
  membersPage: 1,
  membersHasMore: true,
  membersLoading: false,
  membersSearch: '',
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
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTeamMembers.pending, (state) => {
      state.membersLoading = true;
    });
    builder.addCase(fetchTeamMembers.fulfilled, (state, action) => {
      const payload = action.payload as { members: TeamMember[]; hasMore: boolean };
      if (state.membersPage === 1) {
        // New search or initial load
        state.members = payload.members;
        state.membersPage = 2;
        state.membersHasMore = payload.hasMore;
      } else {
        // Append
        state.members = [...state.members, ...payload.members];
        state.membersPage += 1;
        state.membersHasMore = payload.hasMore;
      }
      state.membersLoading = false;
    });
    builder.addCase(fetchTeamMembers.rejected, (state, action) => {
      state.membersLoading = false;
      state.error = action.error.message || 'Failed to fetch team members';
    });
    builder.addCase(fetchTeamInvites.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch team invites';
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

export const { setMembersSearch, resetMembers } = teamsSlice.actions;
export default teamsSlice.reducer;
