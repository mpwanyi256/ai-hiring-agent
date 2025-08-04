import { RootState } from '@/store';

// Profile selectors
export const selectUserProfile = (state: RootState) => state.settings.profile;
export const selectIsProfileLoading = (state: RootState) => state.settings.isLoading;
export const selectIsProfileUpdating = (state: RootState) => state.settings.isUpdating;
export const selectIsAvatarUploading = (state: RootState) => state.settings.isUploadingAvatar;

// Notification preferences selectors
export const selectNotificationPreferences = (state: RootState) =>
  state.settings.notificationPreferences;

// Error selectors
export const selectSettingsError = (state: RootState) => state.settings.error;

// Computed selectors
export const selectUserFullName = (state: RootState) => {
  const profile = state.settings.profile;
  if (!profile) return '';
  return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
};

export const selectIsCompanyOwner = (state: RootState) => {
  return state.settings.profile?.is_company_owner || false;
};
