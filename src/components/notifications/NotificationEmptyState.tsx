import React from 'react';
import { Bell } from 'lucide-react';

export const NotificationEmptyState: React.FC = () => {
  return (
    <div className="max-h-80 overflow-y-auto">
      <div className="p-6 text-center">
        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No notifications</p>
        <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</p>
      </div>
    </div>
  );
};
