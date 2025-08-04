import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchUserProfile,
  updateUserProfile,
  changeUserPassword,
  uploadUserAvatar,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from './settingsThunks';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar_url?: string;
  email_verified?: boolean;
  company_id: string;
  is_company_owner?: boolean;
}

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  company_id: string;
  email_enabled: boolean;
  email_job_applications: boolean;
  email_interview_scheduled: boolean;
  email_interview_reminders: boolean;
  email_candidate_updates: boolean;
  email_system_updates: boolean;
  email_marketing: boolean;
  push_enabled: boolean;
  push_job_applications: boolean;
  push_interview_scheduled: boolean;
  push_interview_reminders: boolean;
  push_candidate_updates: boolean;
  in_app_enabled: boolean;
  in_app_job_applications: boolean;
  in_app_interview_scheduled: boolean;
  in_app_candidate_updates: boolean;
  in_app_system_updates: boolean;
  email_digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quiet_hours_start: string;
  quiet_hours_end: string;
}

interface SettingsState {
  profile: UserProfile | null;
  notificationPreferences: NotificationPreferences | null;
  isLoading: boolean;
  isUpdating: boolean;
  isUploadingAvatar: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  profile: null,
  notificationPreferences: null,
  isLoading: false,
  isUpdating: false,
  isUploadingAvatar: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    setNotificationPreferences: (state, action: PayloadAction<NotificationPreferences>) => {
      state.notificationPreferences = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch User Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update User Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdating = false;
        if (state.profile) {
          state.profile = { ...state.profile, ...action.payload };
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Change Password
    builder
      .addCase(changeUserPassword.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(changeUserPassword.fulfilled, (state) => {
        state.isUpdating = false;
      })
      .addCase(changeUserPassword.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Upload Avatar
    builder
      .addCase(uploadUserAvatar.pending, (state) => {
        state.isUploadingAvatar = true;
        state.error = null;
      })
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        state.isUploadingAvatar = false;
        if (state.profile) {
          state.profile.avatar_url = action.payload.avatar_url;
        }
      })
      .addCase(uploadUserAvatar.rejected, (state, action) => {
        state.isUploadingAvatar = false;
        state.error = action.payload as string;
      });

    // Fetch Notification Preferences
    builder
      .addCase(fetchNotificationPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notificationPreferences = action.payload;
      })
      .addCase(fetchNotificationPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Notification Preferences
    builder
      .addCase(updateNotificationPreferences.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.notificationPreferences = action.payload;
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setProfile, setNotificationPreferences } = settingsSlice.actions;
export default settingsSlice.reducer;
