import React from 'react';
import { PlatformStats } from '@/types/admin';

interface PlatformOverviewProps {
  stats: PlatformStats | null;
}

export const PlatformOverview: React.FC<PlatformOverviewProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">User Growth</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="font-medium">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New This Month</span>
              <span className="font-medium text-green-600">+{stats?.newUsersThisMonth || 0}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Business Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Companies</span>
              <span className="font-medium">{stats?.totalCompanies || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Revenue</span>
              <span className="font-medium text-green-600">${stats?.totalRevenue || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
