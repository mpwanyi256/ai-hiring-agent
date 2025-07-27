import React from 'react';
import { DocumentCheckIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';

interface AdminQuickActionsProps {
  onRefreshStats: () => void;
  onManageSubscriptions: () => void;
}

export const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({
  onRefreshStats,
  onManageSubscriptions,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={onManageSubscriptions}
          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
              <DocumentCheckIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Manage Subscriptions</h3>
              <p className="text-sm text-gray-600">Create and edit subscription plans</p>
            </div>
          </div>
        </button>

        <button
          onClick={onRefreshStats}
          className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
              <ChartBarIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Refresh Stats</h3>
              <p className="text-sm text-gray-600">Update platform statistics</p>
            </div>
          </div>
        </button>

        <div className="p-4 border border-gray-200 rounded-lg opacity-50 text-left">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <UsersIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
