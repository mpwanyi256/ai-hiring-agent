// Timeline Event Types
export interface TimelineEvent {
  id: string;
  type:
    | 'application'
    | 'evaluation'
    | 'interview'
    | 'contract'
    | 'status_change'
    | 'note'
    | 'email'
    | 'call'
    | 'meeting'
    | 'assessment'
    | 'reference'
    | 'offer';
  title: string;
  description?: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error' | 'info' | 'pending';
  metadata?: Record<string, unknown>;
  performer?: {
    name: string;
    role?: string;
    avatar?: string;
  };
  candidate_id?: string;
}

export interface TimelineEventsResponse {
  success: boolean;
  error: string | null;
  events: TimelineEvent[];
  total: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'candidate' | 'contract' | 'interview' | 'system';
  title: string;
  message: string;
  timestamp: string;
  created_at: string;
  status: 'success' | 'warning' | 'error' | 'info';
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  companyId: string;
  relatedEntityId: string;
  relatedEntityType: string;
  userId: string;
  readAt: string;
  read: boolean;
  is_read: boolean;
  candidate_id?: string;
  company_id: string;
  createdAt: string;
  actionUrl: string;
  actionText: string;
  metadata?: Record<string, unknown>;
  entity_type: string;
  entity_id: string;
}

export interface NotificationsResponse {
  success: boolean;
  error: string | null;
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// Notification State Management
export interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Notification Action Types
export type NotificationActionType = 'mark_read' | 'mark_unread' | 'delete';

export interface NotificationAction {
  type: NotificationActionType;
  notificationIds: string[];
}

// Notification Filter Types
export interface NotificationFilters {
  type?: Notification['type'];
  status?: Notification['status'];
  read?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Notification Preferences
export interface NotificationPreferences {
  email: {
    contractOffers: boolean;
    interviews: boolean;
    evaluations: boolean;
    applications: boolean;
  };
  inApp: {
    contractOffers: boolean;
    interviews: boolean;
    evaluations: boolean;
    applications: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
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
