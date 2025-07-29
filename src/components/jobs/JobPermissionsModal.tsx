'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { RootState } from '@/store';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { JobPermissionLevel } from '@/types/jobPermissions';
import {
  fetchJobPermissions,
  grantJobPermission,
  updateJobPermission,
  removeJobPermission,
} from '@/store/jobPermissions/jobPermissionsThunks';
import { fetchTeamMembers } from '@/store/teams/teamsThunks';
import { UserGroupIcon, PlusIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface JobPermissionsModalProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}

const permissionLevels = [
  {
    value: JobPermissionLevel.VIEWER,
    label: 'Viewer',
    description: 'Can view candidates and interviews',
  },
  {
    value: JobPermissionLevel.INTERVIEWER,
    label: 'Interviewer',
    description: 'Can conduct interviews',
  },
  {
    value: JobPermissionLevel.MANAGER,
    label: 'Manager',
    description: 'Can manage candidates and interviews',
  },
  { value: JobPermissionLevel.ADMIN, label: 'Admin', description: 'Full access to job management' },
];

const permissionColors = {
  [JobPermissionLevel.VIEWER]: 'bg-gray-100 text-gray-800',
  [JobPermissionLevel.INTERVIEWER]: 'bg-blue-100 text-blue-800',
  [JobPermissionLevel.MANAGER]: 'bg-green-100 text-green-800',
  [JobPermissionLevel.ADMIN]: 'bg-purple-100 text-purple-800',
};

export default function JobPermissionsModal({
  open,
  onClose,
  jobId,
  jobTitle,
}: JobPermissionsModalProps) {
  const dispatch = useAppDispatch();
  const { permissions, loading, error } = useAppSelector(
    (state: RootState) => state.jobPermissions,
  );
  const { members } = useAppSelector((state: RootState) => state.teams);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermissionLevel, setSelectedPermissionLevel] = useState(JobPermissionLevel.VIEWER);
  const [isGranting, setIsGranting] = useState(false);

  // Fetch job permissions and team members when modal opens
  useEffect(() => {
    if (open && jobId && user?.companyId) {
      dispatch(fetchJobPermissions(jobId));
      dispatch(fetchTeamMembers({ companyId: user.companyId, page: 1, search: '' }));
    }
  }, [open, jobId, user?.companyId, dispatch]);

  // Get available users (team members not already assigned)
  const assignedUserIds = permissions.map((p) => p.user_id);
  const availableUsers = members.filter((member) => !assignedUserIds.includes(member.id));

  const handleGrantPermission = async () => {
    if (!selectedUserId || !selectedPermissionLevel) return;

    // Find the selected user email
    const selectedUser = members.find((member) => member.id === selectedUserId);
    if (!selectedUser) return;

    setIsGranting(true);
    try {
      await dispatch(
        grantJobPermission({
          job_id: jobId,
          user_email: selectedUser.email,
          permission_level: selectedPermissionLevel,
        }),
      ).unwrap();

      setSelectedUserId('');
      setSelectedPermissionLevel(JobPermissionLevel.VIEWER);
    } catch (error) {
      console.error('Failed to grant permission:', error);
    } finally {
      setIsGranting(false);
    }
  };

  const handleUpdatePermission = async (permission: any, newLevel: JobPermissionLevel) => {
    try {
      await dispatch(
        updateJobPermission({
          job_id: jobId,
          user_id: permission.user_id,
          permission_level: newLevel,
        }),
      ).unwrap();
    } catch (error) {
      console.error('Failed to update permission:', error);
    }
  };

  const handleRevokePermission = async (permission: any) => {
    if (!confirm('Are you sure you want to revoke this permission?')) return;

    try {
      await dispatch(
        removeJobPermission({
          job_id: jobId,
          user_id: permission.user_id,
        }),
      ).unwrap();
    } catch (error) {
      console.error('Failed to revoke permission:', error);
    }
  };

  const footer = (
    <div className="flex justify-end space-x-3">
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
    </div>
  );

  return (
    <Modal isOpen={open} onClose={onClose} title="Manage Team Access" footer={footer}>
      <div className="space-y-6">
        {/* Job Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <UserGroupIcon className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-gray-900">{jobTitle}</h3>
          </div>
          <p className="text-sm text-gray-600">
            Control which team members can access this job and their permission levels.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start space-x-2">
            <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Add New Permission */}
        {availableUsers.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>Add Team Member</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select team member...</option>
                  {availableUsers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Level
                </label>
                <select
                  value={selectedPermissionLevel}
                  onChange={(e) => setSelectedPermissionLevel(e.target.value as JobPermissionLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {permissionLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleGrantPermission}
                  disabled={!selectedUserId || isGranting}
                  isLoading={isGranting}
                  size="sm"
                  className="w-full"
                >
                  Grant Access
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Current Permissions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Current Team Access</h4>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No team members assigned to this job yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {permission.user_first_name?.[0] || '?'}
                        {permission.user_last_name?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {permission.user_first_name} {permission.user_last_name}
                      </p>
                      <p className="text-sm text-gray-500">{permission.user_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <select
                      value={permission.permission_level}
                      onChange={(e) =>
                        handleUpdatePermission(permission, e.target.value as JobPermissionLevel)
                      }
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {permissionLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>

                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${permissionColors[permission.permission_level]}`}
                    >
                      {permission.permission_level}
                    </span>

                    {permission.permission_level !== JobPermissionLevel.ADMIN && (
                      <button
                        onClick={() => handleRevokePermission(permission)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Revoke access"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permission Levels Info */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Permission Levels</h5>
          <div className="space-y-1 text-sm text-blue-800">
            {permissionLevels.map((level) => (
              <div key={level.value} className="flex justify-between">
                <span className="font-medium">{level.label}:</span>
                <span>{level.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
