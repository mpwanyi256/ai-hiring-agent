import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ExternalLink, Loader2 } from 'lucide-react';
import { formatDateTime, getNotificationIcon, getNotificationActionUrl } from '@/lib/utils';
import { Notification } from '@/types/notifications';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchNotifications,
  markNotificationAsRead,
} from '@/store/notifications/notificationsSlice';
import {
  selectNotifications,
  selectNotificationsLoading,
  selectUnreadCount,
  selectRecentNotifications,
} from '@/store/notifications/notificationsSelectors';

interface NotificationDropdownProps {
  className?: string;
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'contract_offer':
      return 'text-green-600 bg-green-50';
    case 'interview':
      return 'text-blue-600 bg-blue-50';
    case 'application':
      return 'text-purple-600 bg-purple-50';
    case 'evaluation':
      return 'text-orange-600 bg-orange-50';
    case 'system':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export default function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  // Redux selectors
  const notifications = useAppSelector(selectNotifications);
  const isLoading = useAppSelector(selectNotificationsLoading);
  const unreadCount = useAppSelector(selectUnreadCount);
  const recentNotifications = useAppSelector(selectRecentNotifications);

  // Fetch notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications({}));
  }, [dispatch]);

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

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read using Redux
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification.id));
    }

    // Navigate to the relevant page
    const actionUrl = getNotificationActionUrl(notification);
    if (actionUrl) {
      window.location.href = actionUrl;
    }

    setIsOpen(false);
  };

  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(markNotificationAsRead(notificationId));
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2 hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground hover:bg-primary/90">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
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

          {/* Loading State */}
          {isLoading && (
            <div className="p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Loading notifications...</p>
            </div>
          )}

          {/* Notifications List */}
          {!isLoading && (
            <div className="max-h-80 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentNotifications.map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    return (
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
                            className={`p-1.5 rounded-full ${getNotificationColor(notification.type)}`}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDateTime(notification.timestamp)}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 ml-2">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                    className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                                  >
                                    Mark read
                                  </button>
                                )}
                                {getNotificationActionUrl(notification) && (
                                  <ExternalLink className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
