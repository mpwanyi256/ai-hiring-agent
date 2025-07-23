import { createSlice } from '@reduxjs/toolkit';
import { TeamState } from '../../types/teams';
import { fetchTeam, inviteUser, removeUser, resendInvite } from './teamsThunks';

const initialState: TeamState = {
  members: [],
  invites: [],
  loading: false,
  error: null,
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchTeam.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchTeam.fulfilled, (state, action) => {
      state.members = action.payload.members;
      state.invites = action.payload.invites;
      state.loading = false;
    });
    builder.addCase(fetchTeam.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch team';
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

export default teamsSlice.reducer;
