import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  Notification,
  MarkNotificationReadPayload,
  MarkAllNotificationsReadPayload,
} from '@/types/notifications';
import { apiUtils } from '../api';

interface FetchNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const fetchNotifications = createAsyncThunk<
  FetchNotificationsResponse,
  { limit?: number },
  { rejectValue: string }
>('notifications/fetchNotifications', async ({ limit = 20 }, { rejectWithValue }) => {
  try {
    const response = await apiUtils.get<FetchNotificationsResponse>(
      `/api/notifications?limit=${limit}`,
    );
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch notifications');
  }
});

export const markNotificationAsRead = createAsyncThunk<
  { notificationId: string },
  MarkNotificationReadPayload,
  { rejectValue: string }
>('notifications/markAsRead', async ({ notificationId, userId }, { rejectWithValue }) => {
  try {
    await apiUtils.patch(`/api/notifications/${notificationId}`, {
      isRead: true,
      userId,
    });
    return { notificationId };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to mark notification as read');
  }
});

export const markAllNotificationsAsRead = createAsyncThunk<
  void,
  MarkAllNotificationsReadPayload,
  { rejectValue: string }
>('notifications/markAllAsRead', async ({ userId }, { rejectWithValue }) => {
  try {
    await apiUtils.patch('/api/notifications/mark-all-read', {
      userId,
    });
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || 'Failed to mark all notifications as read',
    );
  }
});
