import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { Notification } from '@/types/notifications';

// Base selectors
export const selectNotificationsState = (state: RootState) => state.notifications;

export const selectNotifications = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.notifications,
);

export const selectNotificationsLoading = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.isLoading,
);

export const selectNotificationsError = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.error,
);

export const selectUnreadCount = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.unreadCount,
);

export const selectNotificationsPagination = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.pagination,
);

// Derived selectors
export const selectUnreadNotifications = createSelector([selectNotifications], (notifications) =>
  notifications.filter((notification) => !notification.read),
);

export const selectReadNotifications = createSelector([selectNotifications], (notifications) =>
  notifications.filter((notification) => notification.read),
);

export const selectRecentNotifications = createSelector([selectNotifications], (notifications) =>
  notifications.slice(0, 5),
);

export const selectNotificationsByType = createSelector([selectNotifications], (notifications) => {
  return notifications.reduce(
    (acc, notification) => {
      const type = notification.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(notification);
      return acc;
    },
    {} as Record<string, Notification[]>,
  );
});

export const selectNotificationById = createSelector(
  [selectNotifications, (state: RootState, notificationId: string) => notificationId],
  (notifications, notificationId) =>
    notifications.find((notification) => notification.id === notificationId),
);

export const selectHasUnreadNotifications = createSelector(
  [selectUnreadCount],
  (unreadCount) => unreadCount > 0,
);

export const selectNotificationsStats = createSelector(
  [selectNotifications, selectUnreadCount],
  (notifications, unreadCount) => ({
    total: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
    byType: notifications.reduce(
      (acc, notification) => {
        const type = notification.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  }),
);
