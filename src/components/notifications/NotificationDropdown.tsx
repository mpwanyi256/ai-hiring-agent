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
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationDropdownProps {
  className?: string;
}

const getNotificationIcon = (type: string, category: string) => {
  const iconClass = 'h-4 w-4';

  if (category === 'candidate') return <User className={iconClass} />;
  if (category === 'contract') return <FileText className={iconClass} />;
  if (category === 'interview') return <Calendar className={iconClass} />;
  if (category === 'system') return <Settings className={iconClass} />;

  switch (type) {
    case 'success':
      return <CheckCircle className={iconClass} />;
    case 'warning':
      return <AlertTriangle className={iconClass} />;
    case 'error':
      return <XCircle className={iconClass} />;
    default:
      return <Info className={iconClass} />;
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

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification,
      ),
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
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
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
                <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`p-1.5 rounded-full ${getNotificationColor(notification.type)} flex-shrink-0`}
                      >
                        {getNotificationIcon(notification.type, notification.category)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4
                            className={`text-sm font-medium truncate ${
                              notification.isRead ? 'text-gray-600' : 'text-gray-900'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>

                        <p
                          className={`text-xs mb-2 line-clamp-2 ${
                            notification.isRead ? 'text-gray-500' : 'text-gray-700'
                          }`}
                        >
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <time className="text-xs text-gray-400">
                            {formatDateTime(notification.createdAt)}
                          </time>

                          {notification.actionUrl && (
                            <div className="flex items-center text-xs text-blue-600">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              <span>{notification.actionText || 'View'}</span>
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
          {notifications.length > 0 && (
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
