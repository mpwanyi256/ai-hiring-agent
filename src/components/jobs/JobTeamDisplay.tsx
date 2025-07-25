'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectCurrentJob } from '@/store/jobs/jobsSelectors';
import {
  fetchJobPermissions,
  grantJobPermission,
} from '@/store/jobPermissions/jobPermissionsThunks';
import { selectJobPermissions } from '@/store/jobPermissions/jobPermissionsSelectors';
import Button from '@/components/ui/Button';
import { JobPermissionLevel } from '@/types/jobPermissions';
import { useToast } from '@/components/providers/ToastProvider';
import { JobPermissions } from './JobPermissions';
import Modal from '@/components/ui/Modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const permissionLevelColors = {
  [JobPermissionLevel.VIEWER]: 'bg-gray-100 text-gray-800',
  [JobPermissionLevel.INTERVIEWER]: 'bg-blue-100 text-blue-800',
  [JobPermissionLevel.MANAGER]: 'bg-purple-100 text-purple-800',
  [JobPermissionLevel.ADMIN]: 'bg-green-100 text-green-800',
};

export function JobTeamDisplay() {
  const dispatch = useAppDispatch();
  const job = useAppSelector(selectCurrentJob);
  const permissions = useAppSelector(selectJobPermissions);
  const [showFullTeam, setShowFullTeam] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
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

  const handleInviteUser = async () => {
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

      success('Team member invited successfully');
      setNewUserEmail('');
      setNewUserPermission(JobPermissionLevel.VIEWER);
      setShowInviteForm(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to invite team member');
    }
  };

  if (!job) return null;

  const displayedPermissions = permissions.slice(0, 5);
  const hasMore = permissions.length > 5;

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-4">
        {/* Team Members Avatars */}
        {displayedPermissions.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 mr-2">Team:</span>
            <div className="flex -space-x-2">
              {displayedPermissions.map((permission) => (
                <Tooltip key={permission.id}>
                  <TooltipTrigger asChild>
                    <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center relative cursor-pointer hover:z-10">
                      <span className="text-xs font-medium text-primary">
                        {permission.user_first_name?.[0] ||
                          (permission.user_email && permission.user_email.length > 0
                            ? permission.user_email[0].toUpperCase()
                            : '?')}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white p-2 rounded-md border border-gray-200 shadow-md">
                    <div className="text-center">
                      <p className="font-medium text-black">
                        {permission.user_first_name && permission.user_last_name
                          ? `${permission.user_first_name} ${permission.user_last_name}`
                          : permission.user_email}
                      </p>
                      <p className="text-xs text-gray-500">{permission.user_email}</p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs mt-1 ${permissionLevelColors[permission.permission_level as JobPermissionLevel]}`}
                      >
                        {permission.permission_level}
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}

              {hasMore && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowFullTeam(true)}
                      className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      +{permissions.length - 5}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{permissions.length - 5} more team members</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {/* View All Button */}
        {permissions.length > 0 && (
          <button
            onClick={() => setShowFullTeam(true)}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View All ({permissions.length})
          </button>
        )}

        {/* Full Team Modal */}
        <Modal
          isOpen={showFullTeam}
          onClose={() => setShowFullTeam(false)}
          title="Team Access"
          size="lg"
        >
          <JobPermissions />
        </Modal>

        {/* Invite Form Modal */}
        <Modal
          isOpen={showInviteForm}
          onClose={() => {
            setShowInviteForm(false);
            setNewUserEmail('');
            setNewUserPermission(JobPermissionLevel.VIEWER);
          }}
          title="Invite Team Member"
          footer={
            <div className="flex items-center space-x-2">
              <Button onClick={handleInviteUser} disabled={!newUserEmail.trim()}>
                Send Invite
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowInviteForm(false);
                  setNewUserEmail('');
                  setNewUserPermission(JobPermissionLevel.VIEWER);
                }}
              >
                Cancel
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permission Level
              </label>
              <select
                value={newUserPermission}
                onChange={(e) => setNewUserPermission(e.target.value as JobPermissionLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value={JobPermissionLevel.VIEWER}>
                  Viewer - Can view candidates and results
                </option>
                <option value={JobPermissionLevel.INTERVIEWER}>
                  Interviewer - Can evaluate candidates
                </option>
                <option value={JobPermissionLevel.MANAGER}>
                  Manager - Can manage job settings
                </option>
                <option value={JobPermissionLevel.ADMIN}>Admin - Full access</option>
              </select>
            </div>
          </div>
        </Modal>
      </div>
    </TooltipProvider>
  );
}
