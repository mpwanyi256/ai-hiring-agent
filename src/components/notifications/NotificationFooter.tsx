import React from 'react';
import Link from 'next/link';

interface NotificationFooterProps {
  hasNotifications: boolean;
  onClose: () => void;
}

export const NotificationFooter: React.FC<NotificationFooterProps> = ({
  hasNotifications,
  onClose,
}) => {
  if (!hasNotifications) {
    return null;
  }

  return (
    <div className="p-3 border-t border-gray-100 bg-gray-50">
      <Link
        href="/dashboard/notifications"
        onClick={onClose}
        className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-1"
      >
        View All Notifications
      </Link>
    </div>
  );
};
