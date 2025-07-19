'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/store';
import {
  selectRecentActivity,
  selectRecentActivityLoading,
  selectRecentActivityError,
} from '@/store/dashboard/dashboardSelectors';
import { selectUser } from '@/store/auth/authSelectors';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface RecentActivityProps {
  maxItems?: number;
  className?: string;
}

export default function RecentActivity({ maxItems = 5, className = '' }: RecentActivityProps) {
  const user = useAppSelector(selectUser);
  const activities = useAppSelector(selectRecentActivity);
  const loading = useAppSelector(selectRecentActivityLoading);
  const error = useAppSelector(selectRecentActivityError);

  // Remove the useEffect since this component should display static data
  // The data should be loaded by the parent dashboard component

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
          <p>Failed to load recent activity</p>
        </div>
      </div>
    );
  }

  const recentActivities = activities.slice(0, maxItems);

  if (recentActivities.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center text-gray-500 py-8">
          <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'candidate_applied':
        return UserGroupIcon;
      case 'interview_scheduled':
        return ClockIcon;
      case 'interview_completed':
        return CheckCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const getActivityColor = (eventType: string) => {
    switch (eventType) {
      case 'candidate_applied':
        return 'text-blue-600 bg-blue-50';
      case 'interview_scheduled':
        return 'text-yellow-600 bg-yellow-50';
      case 'interview_completed':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {recentActivities.map((activity) => {
          const Icon = getActivityIcon(activity.event_type);
          const colorClasses = getActivityColor(activity.event_type);

          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${colorClasses}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
