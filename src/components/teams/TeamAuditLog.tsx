'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { RootState } from '@/store';
import {
  TeamActivity,
  UserActivityEventType,
  TeamInviteMetadata,
  JobPermissionMetadata,
  TeamMemberRemovedMetadata,
} from '@/types/auditLog';
import {
  ClockIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CheckCircleIcon,
  UserMinusIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface TeamAuditLogProps {
  companyId: string;
}

const eventTypeIcons = {
  [UserActivityEventType.TEAM_INVITE_SENT]: EnvelopeIcon,
  [UserActivityEventType.TEAM_INVITE_ACCEPTED]: CheckCircleIcon,
  [UserActivityEventType.TEAM_INVITE_REJECTED]: XMarkIcon,
  [UserActivityEventType.TEAM_MEMBER_REMOVED]: UserMinusIcon,
  [UserActivityEventType.JOB_PERMISSION_GRANTED]: ShieldCheckIcon,
  [UserActivityEventType.JOB_PERMISSION_UPDATED]: ShieldCheckIcon,
  [UserActivityEventType.JOB_PERMISSION_REVOKED]: ShieldCheckIcon,
};

const eventTypeColors = {
  [UserActivityEventType.TEAM_INVITE_SENT]: 'text-blue-600 bg-blue-100',
  [UserActivityEventType.TEAM_INVITE_ACCEPTED]: 'text-green-600 bg-green-100',
  [UserActivityEventType.TEAM_INVITE_REJECTED]: 'text-red-600 bg-red-100',
  [UserActivityEventType.TEAM_MEMBER_REMOVED]: 'text-red-600 bg-red-100',
  [UserActivityEventType.JOB_PERMISSION_GRANTED]: 'text-purple-600 bg-purple-100',
  [UserActivityEventType.JOB_PERMISSION_UPDATED]: 'text-yellow-600 bg-yellow-100',
  [UserActivityEventType.JOB_PERMISSION_REVOKED]: 'text-orange-600 bg-orange-100',
};

export default function TeamAuditLog({ companyId }: TeamAuditLogProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedEventTypes, setSelectedEventTypes] = useState<UserActivityEventType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch activities
  const fetchActivities = async (pageNum: number = 1, append: boolean = false) => {
    if (!companyId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId,
        page: pageNum.toString(),
        limit: '20',
      });

      if (selectedEventTypes.length > 0) {
        params.append('eventTypes', selectedEventTypes.join(','));
      }

      const response = await fetch(`/api/teams/activities?${params}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch activities');
        return;
      }

      if (append) {
        setActivities((prev) => [...prev, ...data.activities]);
      } else {
        setActivities(data.activities);
      }

      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load audit log');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchActivities(1, false);
  }, [companyId, selectedEventTypes]);

  // Load more activities
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchActivities(page + 1, true);
    }
  };

  // Handle filter changes
  const handleEventTypeToggle = (eventType: UserActivityEventType) => {
    setSelectedEventTypes((prev) => {
      if (prev.includes(eventType)) {
        return prev.filter((type) => type !== eventType);
      } else {
        return [...prev, eventType];
      }
    });
  };

  // Format activity metadata for display
  const formatActivityDetails = (activity: TeamActivity): string => {
    const meta = activity.meta;

    switch (activity.event_type) {
      case UserActivityEventType.TEAM_INVITE_SENT:
        const inviteData = meta as TeamInviteMetadata;
        return `Invited ${inviteData.invitee_name} (${inviteData.invitee_email}) as ${inviteData.role}`;

      case UserActivityEventType.TEAM_INVITE_ACCEPTED:
        const acceptedData = meta as TeamInviteMetadata;
        return `${acceptedData.invitee_name} accepted invitation to join as ${acceptedData.role}`;

      case UserActivityEventType.TEAM_INVITE_REJECTED:
        const rejectedData = meta as TeamInviteMetadata;
        return `${rejectedData.invitee_name} declined invitation`;

      case UserActivityEventType.JOB_PERMISSION_GRANTED:
        const grantedData = meta as JobPermissionMetadata;
        return `Granted ${grantedData.permission_level} access to ${grantedData.user_name} for "${grantedData.job_title}"`;

      case UserActivityEventType.JOB_PERMISSION_UPDATED:
        const updatedData = meta as JobPermissionMetadata;
        return `Changed ${updatedData.user_name}'s access from ${updatedData.old_permission_level} to ${updatedData.new_permission_level} for "${updatedData.job_title}"`;

      case UserActivityEventType.JOB_PERMISSION_REVOKED:
        const revokedData = meta as JobPermissionMetadata;
        return `Revoked ${revokedData.permission_level} access from ${revokedData.user_name} for "${revokedData.job_title}"`;

      case UserActivityEventType.TEAM_MEMBER_REMOVED:
        const removedData = meta as TeamMemberRemovedMetadata;
        return `Removed ${removedData.removed_user_name} (${removedData.removed_user_role}) from the team`;

      default:
        return activity.message;
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Team Activity Log</h3>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <FunnelIcon className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-3">Filter by Event Type</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.values(UserActivityEventType)
              .filter((type) => type.startsWith('team_') || type.startsWith('job_permission_'))
              .map((eventType) => (
                <label key={eventType} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedEventTypes.includes(eventType)}
                    onChange={() => handleEventTypeToggle(eventType)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="capitalize">{eventType.replace(/_/g, ' ')}</span>
                </label>
              ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Activities list */}
      <div className="bg-white rounded-lg border divide-y">
        {loading && activities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No team activities found.</p>
          </div>
        ) : (
          <>
            {activities.map((activity) => {
              const Icon = eventTypeIcons[activity.event_type] || UserGroupIcon;
              const colorClass =
                eventTypeColors[activity.event_type] || 'text-gray-600 bg-gray-100';

              return (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900">{activity.user_name}</p>
                        <span className="text-gray-500 text-sm">
                          {formatRelativeTime(activity.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{formatActivityDetails(activity)}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load more button */}
            {hasMore && (
              <div className="p-4 text-center border-t">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-primary hover:text-primary-dark disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
