import { createAsyncThunk } from '@reduxjs/toolkit';
import { NotificationsResponse } from '@/types/notifications';
import { apiUtils } from '../api';
import { RootState } from '..';

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
>(
  'notifications/markAsRead',
  async ({ notificationIds, markAsRead }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;

      const userId = state.auth.user?.id;

      if (!userId) {
        throw new Error('User not found');
      }

      await apiUtils.patch('/api/notifications', {
        notificationIds,
        markAsRead,
        userId,
      });
      return { notificationIds, markAsRead: true };
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      return rejectWithValue(error);
    }
  },
);

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
