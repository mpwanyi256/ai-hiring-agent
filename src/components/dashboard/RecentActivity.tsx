'use client';

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, useAppDispatch, useAppSelector } from '@/store';
import { fetchRecentActivity } from '@/store/dashboard/dashboardThunks';
import {
  selectRecentActivity,
  selectRecentActivityLoading,
  selectRecentActivityError,
} from '@/store/dashboard/dashboardSelectors';
import {
  UserGroupIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { selectUser } from '@/store/auth/authSelectors';

const activityIcons = {
  candidate_applied: UserGroupIcon,
  interview_scheduled: ChatBubbleLeftRightIcon,
  job_created: BriefcaseIcon,
  evaluation_completed: CheckCircleIcon,
};

const activityColors = {
  candidate_applied: 'text-purple-500 bg-purple-50',
  interview_scheduled: 'text-blue-500 bg-blue-50',
  job_created: 'text-green-600 bg-green-50',
  evaluation_completed: 'text-emerald-600 bg-emerald-50',
};

function timeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
}

export default function RecentActivity({ maxItems = 5 }: { maxItems?: number }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const activities = useAppSelector(selectRecentActivity);
  const loading = useAppSelector(selectRecentActivityLoading);
  const error = useAppSelector(selectRecentActivityError);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchRecentActivity({ limit: maxItems }));
    }
  }, [user?.companyId, maxItems, dispatch]);

  if (loading) {
    return <div className="text-gray-500 py-6 text-center">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 py-6 text-center">{error}</div>;
  }
  if (!activities.length) {
    return (
      <div className="flex flex-col items-center py-8">
        <ClockIcon className="w-10 h-10 text-gray-300 mb-2" />
        <div className="text-gray-500 text-sm font-medium mb-1">No recent activity</div>
        <div className="text-xs text-gray-400">Recent events will appear here.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.slice(0, maxItems).map((activity) => {
        const IconComponent =
          activityIcons[activity.event_type as keyof typeof activityIcons] || ClockIcon;
        const color =
          activityColors[activity.event_type as keyof typeof activityColors] ||
          'text-gray-400 bg-gray-50';
        return (
          <div key={activity.id} className="flex items-start space-x-3 group">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${color} flex-shrink-0`}
            >
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                    {activity.message}
                  </p>
                  {activity.meta && activity.meta.job_title && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {activity.meta.job_title}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  <div className="flex items-center text-xs text-gray-400">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${activity.event_type === 'candidate_applied' ? 'bg-blue-400' : 'bg-green-400'} mr-1`}
                    />
                    {timeAgo(activity.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
