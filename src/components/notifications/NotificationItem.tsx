import React from 'react';
import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/types/notifications';
import { NotificationIcon } from './NotificationIcon';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  const handleClick = () => {
    onClick(notification);
  };

  return (
    <div
      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50/30' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <NotificationIcon type={notification.type} category={notification.category} />

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
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
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
  );
};
