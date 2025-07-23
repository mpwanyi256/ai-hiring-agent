import { RootState } from '..';

export const selectTeamMembers = (state: RootState) => state.teams.members;
export const selectTeamInvites = (state: RootState) => state.teams.invites;
export const selectTeamLoading = (state: RootState) => state.teams.loading;
export const selectTeamError = (state: RootState) => state.teams.error;
export const selectIsLoading = (state: RootState) => state.teams.loading;
