import { createAsyncThunk } from '@reduxjs/toolkit';
import { NotificationsResponse } from '@/types/notifications';
import { apiUtils } from '../api';

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params: { limit?: number; offset?: number } = {}) => {
    const { limit = 20, offset = 0 } = params;

    try {
      const response = await apiUtils.get(`/api/notifications?limit=${limit}&offset=${offset}`);
      return response as NotificationsResponse;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  },
);

// Mark notifications as read
export const markNotificationsAsRead = createAsyncThunk<
  { notificationIds: string[]; markAsRead: boolean },
  { notificationIds: string[]; markAsRead: boolean }
>('notifications/markAsRead', async ({ notificationIds, markAsRead }, { rejectWithValue }) => {
  try {
    await apiUtils.patch('/api/notifications', {
      notificationIds,
      markAsRead,
    });

    // Return the original parameters for state updates
    return { notificationIds, markAsRead };
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to mark notifications as read',
    );
  }
});

// Mark notifications as unread
export const markNotificationsAsUnread = createAsyncThunk(
  'notifications/markAsUnread',
  async (notificationIds: string[]) => {
    try {
      await apiUtils.patch('/api/notifications', {
        notificationIds,
        markAsRead: false,
      });
      return { notificationIds, markAsRead: false };
    } catch (error) {
      console.error('Failed to mark notifications as unread:', error);
      throw error;
    }
  },
);

// Refresh notifications (alias for fetchNotifications with current params)
export const refreshNotifications = createAsyncThunk(
  'notifications/refresh',
  async (_, { getState, dispatch }) => {
    const state = getState() as { notifications: { pagination: { limit: number } } };
    const { pagination } = state.notifications;

    return dispatch(
      fetchNotifications({
        limit: pagination.limit,
        offset: 0,
      }),
    ).unwrap();
  },
);
