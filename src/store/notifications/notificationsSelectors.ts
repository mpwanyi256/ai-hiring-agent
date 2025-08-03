import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';

const selectNotificationsState = (state: RootState) => state.notifications;

export const selectNotifications = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.notifications,
);

export const selectUnreadNotifications = createSelector([selectNotifications], (notifications) =>
  notifications.filter((notification) => !notification.isRead),
);

export const selectUnreadCount = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.unreadCount,
);

export const selectNotificationsLoading = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.isLoading,
);

export const selectNotificationsError = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.error,
);

export const selectRecentNotifications = createSelector([selectNotifications], (notifications) =>
  notifications.slice(0, 10),
);

export const selectNotificationsByCategory = createSelector(
  [selectNotifications],
  (notifications) => {
    return notifications.reduce(
      (acc: Record<string, typeof notifications>, notification) => {
        if (!acc[notification.category]) {
          acc[notification.category] = [];
        }
        acc[notification.category].push(notification);
        return acc;
      },
      {} as Record<string, typeof notifications>,
    );
  },
);
