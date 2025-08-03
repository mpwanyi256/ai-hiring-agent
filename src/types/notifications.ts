export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'candidate' | 'contract' | 'interview' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  userId: string;
  companyId: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetched?: string;
}

export interface MarkNotificationReadPayload {
  notificationId: string;
  userId: string;
}

export interface MarkAllNotificationsReadPayload {
  userId: string;
}

export interface NotificationRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Notification;
  old?: Notification;
}
