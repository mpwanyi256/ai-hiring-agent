import { RootState } from '..';

export const selectTeamMembers = (state: RootState) => state.teams.members;
export const selectTeamInvites = (state: RootState) => state.teams.invites;
export const selectTeamLoading = (state: RootState) => state.teams.loading;
export const selectTeamError = (state: RootState) => state.teams.error;
export const selectIsLoading = (state: RootState) => state.teams.loading;

// Members
export const selectMembersPage = (state: RootState) => state.teams.membersPage;
export const selectMembersHasMore = (state: RootState) => state.teams.membersHasMore;
export const selectMembersLoading = (state: RootState) => state.teams.membersLoading;
export const selectMembersSearch = (state: RootState) => state.teams.membersSearch;
export const selectMembersTotalCount = (state: RootState) => state.teams.membersTotalCount;

// Invites
export const selectInvites = (state: RootState) => state.teams.invites;
export const selectInvitesPage = (state: RootState) => state.teams.invitesPage;
export const selectInvitesHasMore = (state: RootState) => state.teams.invitesHasMore;
export const selectInvitesTotalCount = (state: RootState) => state.teams.invitesTotalCount;
