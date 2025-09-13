import React from 'react';
import {
  DocumentCheckIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

interface AdminQuickActionsProps {
  onRefreshStats: () => void;
  onManageSubscriptions: () => void;
  onManageUsers: () => void;
  onManageCompanies: () => void;
  onViewUserSubscriptions: () => void;
}

export const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({
  onRefreshStats,
  onManageSubscriptions,
  onManageUsers,
  onManageCompanies,
  onViewUserSubscriptions,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <button
          onClick={onManageSubscriptions}
          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
              <DocumentCheckIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Manage Plans</h3>
              <p className="text-sm text-gray-600">Create and edit subscription plans</p>
            </div>
          </div>
        </button>

        <button
          onClick={onManageUsers}
          className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
              <UsersIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600">View and manage all users</p>
            </div>
          </div>
        </button>

        <button
          onClick={onViewUserSubscriptions}
          className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg group-hover:bg-orange-200 transition-colors">
              <CreditCardIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">User Subscriptions</h3>
              <p className="text-sm text-gray-600">Track subscription status</p>
            </div>
          </div>
        </button>

        <button
          onClick={onManageCompanies}
          className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg group-hover:bg-indigo-200 transition-colors">
              <BuildingOfficeIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Companies</h3>
              <p className="text-sm text-gray-600">View all companies</p>
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
      </div>
    </div>
  );
};
