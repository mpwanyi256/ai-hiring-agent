import { RootState } from '..';

export const selectJobPermissions = (state: RootState) => state.jobPermissions.permissions;

export const selectJobPermissionsLoading = (state: RootState) => state.jobPermissions.loading;

export const selectJobPermissionsError = (state: RootState) => state.jobPermissions.error;
