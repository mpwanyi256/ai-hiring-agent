import { RootState } from '@/store';

export const selectAdminUsers = (state: RootState) => state.admin.users;
export const selectAdminLoading = (state: RootState) => state.admin.isLoading;
export const selectAdminError = (state: RootState) => state.admin.error;
export const selectPlatformStats = (state: RootState) => state.admin.platformStats;
export const selectSubscriptions = (state: RootState) => state.admin.subscriptions;
export const selectSelectedSubscription = (state: RootState) => state.admin.selectedSubscription;
export const selectAdminIsCreating = (state: RootState) => state.admin.isCreating;
export const selectAdminIsUpdating = (state: RootState) => state.admin.isUpdating;
export const selectAdminIsDeleting = (state: RootState) => state.admin.isDeleting;
