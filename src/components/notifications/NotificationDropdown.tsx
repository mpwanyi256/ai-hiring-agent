'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectUser } from '@/store/auth/authSelectors';
import {
  selectUnreadCount,
  selectNotificationsLoading,
  selectRecentNotifications,
} from '@/store/notifications/notificationsSelectors';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/store/notifications/notificationsThunks';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { Notification } from '@/types/notifications';
import { NotificationBell } from './NotificationBell';
import { NotificationHeader } from './NotificationHeader';
import { NotificationList } from './NotificationList';
import { apiSuccess } from '@/lib/notification';
// import { NotificationFooter } from './NotificationFooter';

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const notifications = useAppSelector(selectRecentNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const isLoading = useAppSelector(selectNotificationsLoading);

  // Initialize real-time notifications
  useRealtimeNotifications();

  // Fetch notifications on mount
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchNotifications({ limit: 10 }));
    }
  }, [dispatch, user?.id]);

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
    if (!notification.isRead && user?.id) {
      await dispatch(
        markNotificationAsRead({
          notificationId: notification.id,
          userId: user.id,
        }),
      ).unwrap();

      apiSuccess('Notification marked as read');
    }
  };

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      dispatch(markAllNotificationsAsRead({ userId: user.id }));
    }
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseDropdown = () => {
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <NotificationBell unreadCount={unreadCount} onClick={handleToggleDropdown} />

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <NotificationHeader
            unreadCount={unreadCount}
            onClose={handleCloseDropdown}
            onMarkAllAsRead={unreadCount > 0 ? handleMarkAllAsRead : undefined}
          />

          {/* Notifications List */}
          <NotificationList
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
            isLoading={isLoading}
          />

          {/* Footer */}
          {/* <NotificationFooter
            hasNotifications={notifications.length > 0}
            onClose={handleCloseDropdown}
          /> */}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
