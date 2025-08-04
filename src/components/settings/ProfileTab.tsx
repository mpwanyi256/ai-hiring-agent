import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectUser } from '@/store/auth/authSelectors';
import {
  selectUserProfile,
  selectIsProfileLoading,
  selectIsProfileUpdating,
  selectIsAvatarUploading,
  selectSettingsError,
  selectUserFullName,
} from '@/store/settings/settingsSelectors';
import {
  fetchUserProfile,
  updateUserProfile,
  uploadUserAvatar,
} from '@/store/settings/settingsThunks';
import { Button } from '@/components/ui/button';
import EditFieldModal from '@/components/settings/EditFieldModal';
import { UserCircleIcon, CameraIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/ToastProvider';

export default function ProfileTab() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const profile = useAppSelector(selectUserProfile);
  const isLoading = useAppSelector(selectIsProfileLoading);
  const isUpdating = useAppSelector(selectIsProfileUpdating);
  const isAvatarUploading = useAppSelector(selectIsAvatarUploading);
  const error = useAppSelector(selectSettingsError);
  const fullName = useAppSelector(selectUserFullName);
  const { success, error: showError } = useToast();

  const [editField, setEditField] = useState<null | 'firstName' | 'lastName' | 'bio'>(null);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const handleUpdateProfile = async (field: string, value: string) => {
    try {
      if (field === 'firstName') {
        await dispatch(updateUserProfile({ firstName: value })).unwrap();
      } else if (field === 'lastName') {
        await dispatch(updateUserProfile({ lastName: value })).unwrap();
      }
      success('Profile updated successfully');
      setEditField(null);
    } catch (err) {
      showError('Failed to update profile');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      await dispatch(uploadUserAvatar(file)).unwrap();
      success('Avatar updated successfully');
    } catch (err) {
      showError('Failed to upload avatar');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
      }

      handleAvatarUpload(file);
    }
  };

  const getFieldValue = (field: string) => {
    switch (field) {
      case 'firstName':
        return profile?.firstName || '';
      case 'lastName':
        return profile?.lastName || '';
      case 'bio':
        return ''; // Bio doesn't exist in current profile type
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Profile</h2>
        <p className="text-muted-text">Manage your public profile information and avatar.</p>
      </div>

      {/* Avatar Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <UserCircleIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text">Profile Picture</h3>
          </div>
          <p className="text-sm text-muted-text mt-1">
            Upload a profile picture to personalize your account
          </p>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center gap-6">
            {/* Avatar Display */}
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile picture"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    {profile?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              {isAvatarUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Avatar Upload */}
            <div>
              <div className="font-medium text-text mb-2">{fullName || 'User'}</div>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isAvatarUploading}
              />
              <label htmlFor="avatar-upload">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={isAvatarUploading}
                  asChild
                >
                  <span className="flex items-center gap-2">
                    <CameraIcon className="w-4 h-4" />
                    {isAvatarUploading ? 'Uploading...' : 'Change Avatar'}
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-text mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <UserCircleIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text">Profile Information</h3>
          </div>
          <p className="text-sm text-muted-text mt-1">Update your display name and bio</p>
        </div>
        <div className="px-6 py-6 space-y-6">
          {/* First Name */}
          <div className="flex items-center justify-between py-3">
            <div>
              <label className="text-sm font-medium text-text">First Name</label>
              <p className="text-sm text-muted-text">Your first name</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium text-text">{profile?.firstName || 'Not set'}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditField('firstName')}
                disabled={isUpdating}
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Last Name */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <label className="text-sm font-medium text-text">Last Name</label>
              <p className="text-sm text-muted-text">Your last name</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium text-text">{profile?.lastName || 'Not set'}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditField('lastName')}
                disabled={isUpdating}
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Bio - Placeholder for future implementation */}
          <div className="flex items-start justify-between py-3 border-t border-gray-100">
            <div>
              <label className="text-sm font-medium text-text">Bio</label>
              <p className="text-sm text-muted-text">
                A short description about yourself (coming soon)
              </p>
            </div>
            <div className="flex items-start gap-4 max-w-md">
              <div className="text-right flex-1">
                <span className="text-sm text-text">
                  <span className="text-gray-400">Coming soon...</span>
                </span>
              </div>
              <Button variant="outline" size="sm" disabled className="flex-shrink-0 opacity-50">
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Field Modal */}
      <EditFieldModal
        open={!!editField}
        onClose={() => setEditField(null)}
        label={editField === 'firstName' ? 'First Name' : 'Last Name'}
        value={editField ? getFieldValue(editField) : ''}
        onSave={(value) => editField && handleUpdateProfile(editField, value)}
        inputType="text"
        loading={isUpdating}
      />
    </div>
  );
}
