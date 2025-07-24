'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectCurrentJob } from '@/store/jobs/jobsSelectors';
import {
  fetchJobPermissions,
  grantJobPermission,
} from '@/store/jobPermissions/jobPermissionsThunks';
import {
  selectJobPermissions,
  selectJobPermissionsLoading,
} from '@/store/jobPermissions/jobPermissionsSelectors';
import { UserGroupIcon, UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { JobPermissionLevel } from '@/types/jobPermissions';
import { useToast } from '@/components/providers/ToastProvider';

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

export function JobPermissions() {
  const dispatch = useAppDispatch();
  const job = useAppSelector(selectCurrentJob);
  const permissions = useAppSelector(selectJobPermissions);
  const isLoading = useAppSelector(selectJobPermissionsLoading);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPermission, setNewUserPermission] = useState<JobPermissionLevel>(
    JobPermissionLevel.VIEWER,
  );
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (job?.id) {
      dispatch(fetchJobPermissions(job.id));
    }
  }, [dispatch, job?.id]);

  const handleAddPermission = async () => {
    if (!job?.id || !newUserEmail.trim()) {
      showError('Please enter a valid email address');
      return;
    }

    try {
      await dispatch(
        grantJobPermission({
          job_id: job.id,
          user_email: newUserEmail,
          permission_level: newUserPermission,
        }),
      ).unwrap();

      success('Permission granted successfully');
      setNewUserEmail('');
      setNewUserPermission(JobPermissionLevel.VIEWER);
      setShowAddForm(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to grant permission');
    }
  };

  if (!job) {
    return null;
  }

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
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center"
        >
          <UserPlusIcon className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {/* Add Permission Form */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Add Team Member</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Permission Level
              </label>
              <select
                value={newUserPermission}
                onChange={(e) => setNewUserPermission(e.target.value as JobPermissionLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {Object.entries(permissionLevelLabels).map(([level, label]) => (
                  <option key={level} value={level}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={handleAddPermission}>
                Grant Access
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewUserEmail('');
                  setNewUserPermission(JobPermissionLevel.VIEWER);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading team members...</p>
          </div>
        ) : permissions.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">No team members yet</h4>
            <p className="text-xs text-gray-500">Add team members to collaborate on this job</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {permissions.map((permission) => (
              <div key={permission.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {permission.user_first_name?.[0] || permission.user_email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {permission.user_first_name && permission.user_last_name
                        ? `${permission.user_first_name} ${permission.user_last_name}`
                        : permission.user_email}
                    </p>
                    <p className="text-xs text-gray-500">{permission.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      permissionLevelColors[permission.permission_level as JobPermissionLevel]
                    }`}
                  >
                    {permissionLevelLabels[permission.permission_level as JobPermissionLevel]}
                  </span>
                  <p className="text-xs text-gray-500">
                    {new Date(permission.granted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
