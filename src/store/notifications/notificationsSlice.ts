import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationState } from '@/types/notifications';
import { fetchNotifications, markNotificationsAsRead } from './notificationsThunks';

const initialState: NotificationState = {
  notifications: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.pagination = {
        ...state.pagination,
        page: 1,
        total: 0,
        hasMore: false,
      };
    },
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markNotificationAsUnread: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && notification.read) {
        notification.read = false;
        state.unreadCount += 1;
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.pagination = {
          ...state.pagination,
          total: action.payload.total,
          hasMore: action.payload.notifications.length === state.pagination.limit,
        };
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      // Mark notifications as read
      .addCase(markNotificationsAsRead.pending, () => {
        // Optimistic update is handled in the component
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, { payload }) => {
        const { notificationIds, markAsRead } = payload;
        state.notifications.forEach((notification) => {
          if (notificationIds.includes(notification.id)) {
            notification.is_read = markAsRead;
            notification.read = markAsRead; // Update both fields for compatibility
          }
        });
        state.unreadCount = state.notifications.filter((n) => !n.is_read).length;
        state.isLoading = false;
      })
      .addCase(markNotificationsAsRead.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to mark notifications as read';
        // Revert optimistic update is handled in the component
      });
  },
});

export const {
  clearNotifications,
  setNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  setError,
  setLoading,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
