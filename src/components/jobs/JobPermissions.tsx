'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectCurrentJob } from '@/store/jobs/jobsSelectors';
import {
  fetchJobPermissions,
  grantJobPermissionById,
  removeJobPermission,
  updateJobPermission,
} from '@/store/jobPermissions/jobPermissionsThunks';
import {
  selectJobPermissions,
  selectJobPermissionsLoading,
} from '@/store/jobPermissions/jobPermissionsSelectors';
import {
  UserGroupIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { JobPermissionLevel } from '@/types/jobPermissions';
import { useToast } from '@/components/providers/ToastProvider';
import { selectUser } from '@/store/auth/authSelectors';

const permissionLevelLabels = {
  [JobPermissionLevel.VIEWER]: 'Viewer',
  [JobPermissionLevel.INTERVIEWER]: 'Interviewer',
  [JobPermissionLevel.MANAGER]: 'Manager',
  [JobPermissionLevel.ADMIN]: 'Admin',
};

const permissionLevelColors = {
  [JobPermissionLevel.VIEWER]: 'bg-gray-100 text-gray-800',
  [JobPermissionLevel.INTERVIEWER]: 'bg-blue-100 text-blue-800',
  [JobPermissionLevel.MANAGER]: 'bg-purple-100 text-purple-800',
  [JobPermissionLevel.ADMIN]: 'bg-green-100 text-green-800',
};

interface CompanyMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export function JobPermissions() {
  const dispatch = useAppDispatch();
  const job = useAppSelector(selectCurrentJob);
  const permissions = useAppSelector(selectJobPermissions);
  const isLoading = useAppSelector(selectJobPermissionsLoading);
  const currentUser = useAppSelector(selectUser);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (job?.id) {
      dispatch(fetchJobPermissions(job.id));
      fetchCompanyMembers();
    }
  }, [dispatch, job?.id]);

  const fetchCompanyMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await fetch('/api/company/members');
      if (response.ok) {
        const data = await response.json();
        setCompanyMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch company members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemovePermission = async (userId: string) => {
    if (!job?.id) return;

    // Prevent job creator from removing themselves
    if (job.profileId === userId && currentUser?.id === userId) {
      showError('You cannot remove yourself as the job creator');
      return;
    }

    try {
      await dispatch(
        removeJobPermission({
          job_id: job.id,
          user_id: userId,
        }),
      ).unwrap();

      success('Team member removed successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to remove team member');
    }
  };

  const handleAddSelectedMembers = async () => {
    if (!job?.id || selectedMembers.length === 0) return;

    try {
      for (const userId of selectedMembers) {
        await dispatch(
          grantJobPermissionById({
            job_id: job.id,
            user_id: userId,
            permission_level: JobPermissionLevel.VIEWER,
          }),
        ).unwrap();
      }

      success(`Added ${selectedMembers.length} team member(s) successfully`);
      setSelectedMembers([]);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to add team members');
    }
  };

  const handleUpdatePermission = async (userId: string, newLevel: JobPermissionLevel) => {
    if (!job?.id) return;

    try {
      await dispatch(
        updateJobPermission({
          job_id: job.id,
          user_id: userId,
          permission_level: newLevel,
        }),
      ).unwrap();

      success('Permission updated successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update permission');
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  if (!job) {
    return null;
  }

  // Get members who already have permissions on this job
  const jobMemberIds = new Set(permissions.map((p) => p.user_id));

  // Filter available members (exclude those who already have permissions)
  const availableMembers = companyMembers.filter((member) => !jobMemberIds.has(member.id));

  // Filter by search query
  const filteredAvailableMembers = availableMembers.filter((member) => {
    const searchTerm = searchQuery.toLowerCase();
    const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm) || member.email.toLowerCase().includes(searchTerm);
  });

  const isJobCreator = (userId: string) => job.profileId === userId;
  const isCurrentUser = (userId: string) => currentUser?.id === userId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Team Access
          </h3>
          <p className="text-sm text-gray-600 mt-1">Manage who can access and work with this job</p>
        </div>
      </div>

      {/* Current Job Members */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900">
            Current Job Members ({permissions.length})
          </h4>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading team members...</p>
          </div>
        ) : permissions.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">No team members yet</h4>
            <p className="text-xs text-gray-500">Add team members from your company below</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {permissions.map((permission) => (
              <div key={permission.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {permission.user_first_name?.[0] ||
                          (permission.user_email && permission.user_email.length > 0
                            ? permission.user_email[0].toUpperCase()
                            : '?')}
                      </span>
                    </div>
                    {isJobCreator(permission.user_id) && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <StarIcon className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {permission.user_first_name && permission.user_last_name
                          ? `${permission.user_first_name} ${permission.user_last_name}`
                          : permission.user_email || 'Unknown User'}
                      </p>
                      {isCurrentUser(permission.user_id) && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          You
                        </span>
                      )}
                      {isJobCreator(permission.user_id) && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                          Creator
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{permission.user_email || 'No email'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={permission.permission_level}
                    onChange={(e) =>
                      handleUpdatePermission(
                        permission.user_id,
                        e.target.value as JobPermissionLevel,
                      )
                    }
                    disabled={isJobCreator(permission.user_id)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 disabled:bg-gray-100"
                  >
                    {Object.entries(permissionLevelLabels).map(([level, label]) => (
                      <option key={level} value={level}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    {permission.granted_at
                      ? new Date(permission.granted_at).toLocaleDateString()
                      : 'Unknown date'}
                  </p>
                  <button
                    onClick={() => handleRemovePermission(permission.user_id)}
                    disabled={isJobCreator(permission.user_id) && isCurrentUser(permission.user_id)}
                    className="text-red-500 hover:text-red-700 p-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                    title={
                      isJobCreator(permission.user_id) && isCurrentUser(permission.user_id)
                        ? 'Cannot remove yourself as job creator'
                        : 'Remove member'
                    }
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Company Members */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Available Team Members ({filteredAvailableMembers.length})
            </h4>
            {selectedMembers.length > 0 && (
              <Button size="sm" onClick={handleAddSelectedMembers} className="flex items-center">
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Selected ({selectedMembers.length})
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {loadingMembers ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading company members...</p>
          </div>
        ) : filteredAvailableMembers.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              {searchQuery ? 'No members found' : 'All team members are already added'}
            </h4>
            <p className="text-xs text-gray-500">
              {searchQuery
                ? 'Try a different search term'
                : 'Invite more members to your company to add them to jobs'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {filteredAvailableMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => toggleMemberSelection(member.id)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {member.first_name?.[0] || member.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name}`
                        : member.email}
                    </p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {member.role}
                  </span>
                  {selectedMembers.includes(member.id) && (
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
