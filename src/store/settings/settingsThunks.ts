import { createAsyncThunk } from '@reduxjs/toolkit';
import { UserProfile, NotificationPreferences } from './settingsSlice';

// Fetch user profile
export const fetchUserProfile = createAsyncThunk<UserProfile, void>(
  'settings/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch profile');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch profile');
    }
  },
);

// Update user profile
export const updateUserProfile = createAsyncThunk<
  Partial<UserProfile>,
  Partial<Pick<UserProfile, 'firstName' | 'lastName'>>
>('settings/updateUserProfile', async (updates, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    return updates;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to update profile');
  }
});

// Change user password
export const changeUserPassword = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string }
>('settings/changeUserPassword', async ({ currentPassword, newPassword }, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to change password');
  }
});

// Upload user avatar
export const uploadUserAvatar = createAsyncThunk<{ avatar_url: string }, File>(
  'settings/uploadUserAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload avatar');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to upload avatar');
    }
  },
);

// Fetch notification preferences
export const fetchNotificationPreferences = createAsyncThunk<NotificationPreferences, void>(
  'settings/fetchNotificationPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/user/notification-preferences');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch notification preferences');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch notification preferences',
      );
    }
  },
);

// Update notification preferences
export const updateNotificationPreferences = createAsyncThunk<
  NotificationPreferences,
  Partial<NotificationPreferences>
>('settings/updateNotificationPreferences', async (preferences, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/user/notification-preferences', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update notification preferences');
    }

    return await response.json();
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to update notification preferences',
    );
  }
});
