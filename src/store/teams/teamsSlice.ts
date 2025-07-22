import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TeamState, TeamMember, TeamInvite } from '../../types/teams';

const initialState: TeamState = {
  members: [],
  invites: [],
  loading: false,
  error: null,
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    fetchTeamStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchTeamSuccess(
      state,
      action: PayloadAction<{ members: TeamMember[]; invites: TeamInvite[] }>,
    ) {
      state.loading = false;
      state.members = action.payload.members;
      state.invites = action.payload.invites;
    },
    fetchTeamFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    inviteUserStart(state) {
      state.loading = true;
      state.error = null;
    },
    inviteUserSuccess(state, action: PayloadAction<TeamInvite>) {
      state.loading = false;
      state.invites.push(action.payload);
    },
    inviteUserFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    removeUserStart(state) {
      state.loading = true;
      state.error = null;
    },
    removeUserSuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      state.members = state.members.filter((member) => member.id !== action.payload);
    },
    removeUserFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    resendInviteStart(state) {
      state.loading = true;
      state.error = null;
    },
    resendInviteSuccess(state, action: PayloadAction<TeamInvite>) {
      state.loading = false;
      // Update the invite in the invites array
      const idx = state.invites.findIndex((invite) => invite.id === action.payload.id);
      if (idx !== -1) state.invites[idx] = action.payload;
    },
    resendInviteFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
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
} = teamsSlice.actions;

export default teamsSlice.reducer;
