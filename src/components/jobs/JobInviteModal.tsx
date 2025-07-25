'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { RootState } from '@/store';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { JobPermissionLevel } from '@/types/jobPermissions';
import { TeamMember } from '@/types/teams';
import { grantJobPermission } from '@/store/jobPermissions/jobPermissionsThunks';
import { fetchTeamMembers } from '@/store/teams/teamsThunks';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { apiSuccess, apiError } from '@/lib/notification';

interface JobInviteModalProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}

interface SelectedMember extends TeamMember {
  permissionLevel: JobPermissionLevel;
}

const permissionLevels = [
  {
    value: JobPermissionLevel.VIEWER,
    label: 'Viewer',
    description: 'Can view candidates and interview responses',
    color: 'bg-gray-100 text-gray-800',
  },
  {
    value: JobPermissionLevel.INTERVIEWER,
    label: 'Interviewer',
    description: 'Can conduct interviews and add notes',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    value: JobPermissionLevel.MANAGER,
    label: 'Manager',
    description: 'Can manage candidates through the pipeline',
    color: 'bg-green-100 text-green-800',
  },
  {
    value: JobPermissionLevel.ADMIN,
    label: 'Admin',
    description: 'Full access to job management',
    color: 'bg-purple-100 text-purple-800',
  },
];

export default function JobInviteModal({ open, onClose, jobId, jobTitle }: JobInviteModalProps) {
  const dispatch = useAppDispatch();
  const { members } = useAppSelector((state: RootState) => state.teams);
  const { permissions } = useAppSelector((state: RootState) => state.jobPermissions);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  // Fetch team members when modal opens
  useEffect(() => {
    if (open && user?.companyId) {
      dispatch(fetchTeamMembers({ companyId: user.companyId, page: 1, search: '' }));
    }
  }, [open, user?.companyId, dispatch]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setSearchQuery('');
      setSelectedMembers([]);
      setIsInviting(false);
    }
  }, [open]);

  // Filter available members (exclude already assigned users)
  const assignedUserIds = permissions.map((p) => p.user_id);
  const availableMembers = members.filter(
    (member) =>
      !assignedUserIds.includes(member.id) &&
      (member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleMemberSelect = (member: TeamMember) => {
    const isSelected = selectedMembers.find((m) => m.id === member.id);

    if (isSelected) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
    } else {
      setSelectedMembers([
        ...selectedMembers,
        { ...member, permissionLevel: JobPermissionLevel.VIEWER },
      ]);
    }
  };

  const handlePermissionChange = (memberId: string, level: JobPermissionLevel) => {
    setSelectedMembers(
      selectedMembers.map((member) =>
        member.id === memberId ? { ...member, permissionLevel: level } : member,
      ),
    );
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedMembers.length > 0) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleInvite = async () => {
    setIsInviting(true);

    try {
      // Send invitations for all selected members
      await Promise.all(
        selectedMembers.map((member) =>
          dispatch(
            grantJobPermission({
              job_id: jobId,
              user_email: member.email,
              permission_level: member.permissionLevel,
            }),
          ).unwrap(),
        ),
      );

      apiSuccess(
        `Successfully invited ${selectedMembers.length} team member${
          selectedMembers.length > 1 ? 's' : ''
        } to ${jobTitle}`,
      );
      onClose();
    } catch (error) {
      apiError('Failed to send invitations. Please try again.');
      console.error('Error inviting members:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search team members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Members List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {availableMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery
              ? 'No team members found matching your search'
              : 'No team members available to invite'}
          </div>
        ) : (
          availableMembers.map((member) => {
            const isSelected = selectedMembers.find((m) => m.id === member.id);

            return (
              <div
                key={member.id}
                onClick={() => handleMemberSelect(member)}
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {member.first_name.charAt(0)}
                      {member.last_name.charAt(0)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">
                    {member.first_name} {member.last_name}
                  </h4>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                    {member.role}
                  </span>
                </div>

                {isSelected && <CheckIcon className="w-5 h-5 text-primary" />}
              </div>
            );
          })
        )}
      </div>

      {/* Selected Count */}
      {selectedMembers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            {selectedMembers.length} team member{selectedMembers.length > 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Set Permissions</h3>
        <p className="text-sm text-gray-600">Choose the permission level for each team member</p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {selectedMembers.map((member) => (
          <div key={member.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {member.first_name.charAt(0)}
                  {member.last_name.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {member.first_name} {member.last_name}
                </h4>
                <p className="text-xs text-gray-500">{member.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {permissionLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => handlePermissionChange(member.id, level.value)}
                  className={`p-3 text-left rounded-lg border transition-all ${
                    member.permissionLevel === level.value
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{level.label}</span>
                    {member.permissionLevel === level.value && (
                      <CheckIcon className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{level.description}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-6">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
          1
        </div>
        <span className="text-sm font-medium text-gray-900">Select Members</span>
      </div>

      <ChevronRightIcon className="w-4 h-4 text-gray-400" />

      <div className="flex items-center space-x-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          2
        </div>
        <span
          className={`text-sm font-medium ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-500'}`}
        >
          Set Permissions
        </span>
      </div>
    </div>
  );

  const footer = (
    <div className="flex justify-between">
      <div>
        {currentStep === 2 && (
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}
      </div>

      <div className="flex space-x-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>

        {currentStep === 1 ? (
          <Button onClick={handleNext} disabled={selectedMembers.length === 0}>
            Next
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleInvite}
            isLoading={isInviting}
            disabled={selectedMembers.length === 0}
          >
            <UserPlusIcon className="w-4 h-4 mr-1" />
            Invite {selectedMembers.length} Member{selectedMembers.length > 1 ? 's' : ''}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Invite Team Members to ${jobTitle}`}
      size="lg"
      footer={footer}
    >
      <div className="space-y-6">
        {renderStepIndicator()}
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </div>
    </Modal>
  );
}
