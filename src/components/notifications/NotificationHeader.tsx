import React from 'react';
import Link from 'next/link';

interface NotificationHeaderProps {
  unreadCount: number;
  onClose: () => void;
  onMarkAllAsRead?: () => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  unreadCount,
  onClose,
  onMarkAllAsRead,
}) => {
  return (
    <div className="p-4 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all read
            </button>
          )}
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </Link>
        </div>
      </div>
      {unreadCount > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
