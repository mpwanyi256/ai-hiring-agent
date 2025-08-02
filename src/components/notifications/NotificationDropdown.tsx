'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  User,
  FileText,
  Calendar,
  Settings,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Notification, NotificationsResponse } from '@/types/notifications';

interface NotificationDropdownProps {
  className?: string;
}

const getNotificationIcon = (type: string) => {
  const iconClass = 'h-4 w-4';

  switch (type) {
    case 'contract_offer':
      return <FileText className={iconClass} />;
    case 'interview':
      return <Calendar className={iconClass} />;
    case 'application':
      return <User className={iconClass} />;
    case 'evaluation':
      return <CheckCircle className={iconClass} />;
    case 'system':
      return <Settings className={iconClass} />;
    default:
      return <Info className={iconClass} />;
  }
};

const getNotificationActionUrl = (notification: Notification): string | null => {
  switch (notification.type) {
    case 'contract_offer':
      return notification.candidate_id
        ? `/dashboard/jobs/candidates/${notification.candidate_id}`
        : null;
    case 'interview':
      return `/dashboard/interviews/${notification.entity_id}`;
    case 'application':
      return notification.candidate_id
        ? `/dashboard/jobs/candidates/${notification.candidate_id}`
        : null;
    case 'evaluation':
      return notification.candidate_id
        ? `/dashboard/jobs/candidates/${notification.candidate_id}`
        : null;
    default:
      return null;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'text-green-600 bg-green-50';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50';
    case 'error':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-blue-600 bg-blue-50';
  }
};

// Fetch notifications from API
const fetchNotifications = async (limit = 10): Promise<NotificationsResponse> => {
  try {
    const response = await fetch(`/api/notifications?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return {
      success: false,
      error: 'Failed to fetch notifications',
      notifications: [],
      total: 0,
      unreadCount: 0,
    };
  }
};

// Mark notifications as read
const markNotificationsAsRead = async (notificationIds: string[]): Promise<void> => {
  try {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationIds,
        markAsRead: true,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to mark notifications as read');
    }
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
  }
};

// Mock fallback data for development
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'contract_offer',
    title: 'Contract Signed',
    message: 'Sarah Johnson has successfully signed the contract for Frontend Developer position.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    read: false,
    company_id: 'company-1',
    entity_type: 'contract_offer',
    entity_id: 'offer-123',
    candidate_id: 'candidate-1',
  },
  {
    id: '2',
    type: 'application',
    title: 'New Application',
    message: 'Michael Chen applied for the Backend Developer position.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'info',
    read: true,
    company_id: 'company-1',
    entity_type: 'candidate',
    entity_id: 'candidate-456',
    candidate_id: 'candidate-456',
  },
  {
    id: '3',
    type: 'interview',
    title: 'Interview Reminder',
    message: 'Interview with Emma Davis is scheduled in 30 minutes.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'warning',
    read: false,
    company_id: 'company-1',
    entity_type: 'interview',
    entity_id: 'interview-789',
    candidate_id: 'candidate-789',
  },
];

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentNotifications = notifications.slice(0, 5); // Show only 5 most recent

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Load notifications from API
  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await fetchNotifications(10);
        if (response.success && response.notifications.length > 0) {
          setNotifications(response.notifications);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
        // Keep mock data as fallback
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (notificationId: string) => {
    // Update local state immediately for better UX
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    );

    // Update on server
    try {
      await markNotificationsAsRead([notificationId]);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert local state on error
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, read: false } : notification,
        ),
      );
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    // Generate action URL based on notification type and entity
    const actionUrl = getNotificationActionUrl(notification);
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 transition-all"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium min-w-[20px] bg-primary text-primary-foreground hover:bg-primary/90">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Notifications</h3>
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
                <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`p-1.5 rounded-full ${getNotificationColor(notification.type)} flex-shrink-0`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4
                            className={`text-sm font-medium truncate ${
                              notification.read ? 'text-gray-600' : 'text-gray-900'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>

                        <p
                          className={`text-xs mb-2 line-clamp-2 ${
                            notification.read ? 'text-gray-500' : 'text-gray-700'
                          }`}
                        >
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <time className="text-xs text-gray-400">
                            {formatDateTime(notification.timestamp)}
                          </time>

                          {getNotificationActionUrl(notification) && (
                            <div className="flex items-center text-xs text-blue-600">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              <span>View Details</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-1"
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
