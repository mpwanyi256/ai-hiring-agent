import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectUser } from '@/store/auth/authSelectors';
import {
  selectUserProfile,
  selectIsProfileLoading,
  selectIsProfileUpdating,
  selectSettingsError,
  selectUserFullName,
} from '@/store/settings/settingsSelectors';
import {
  fetchUserProfile,
  updateUserProfile,
  changeUserPassword,
} from '@/store/settings/settingsThunks';
import { Button } from '@/components/ui/button';
import EditFieldModal from '@/components/settings/EditFieldModal';
import ChangePasswordModal from '@/components/settings/ChangePasswordModal';
import { UserIcon, ShieldCheckIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/ToastProvider';

export default function AccountTab() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const profile = useAppSelector(selectUserProfile);
  const isLoading = useAppSelector(selectIsProfileLoading);
  const isUpdating = useAppSelector(selectIsProfileUpdating);
  const error = useAppSelector(selectSettingsError);
  const { success, error: showError } = useToast();

  const [editField, setEditField] = useState<null | 'firstName' | 'lastName'>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

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

  const getFieldValue = (field: string) => {
    switch (field) {
      case 'firstName':
        return profile?.firstName || '';
      case 'lastName':
        return profile?.lastName || '';
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
        <h2 className="text-2xl font-bold text-text mb-2">Account Settings</h2>
        <p className="text-muted-text">Manage your personal information and security settings.</p>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <UserIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text">Personal Information</h3>
          </div>
          <p className="text-sm text-muted-text mt-1">Update your personal details</p>
        </div>
        <div className="px-6 py-6 space-y-6">
          {/* First Name Field */}
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

          {/* Last Name Field */}
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

          {/* Email Field (Read Only) */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <label className="text-sm font-medium text-text">Email Address</label>
              <p className="text-sm text-muted-text">Your login email (cannot be changed)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="font-medium text-text">
                  {profile?.email || user?.email || 'Not set'}
                </span>
                {profile?.email_verified && (
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <ShieldCheckIcon className="w-3 h-3" />
                    Verified
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                Read Only
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Password & Security Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text">Password & Security</h3>
          </div>
          <p className="text-sm text-muted-text mt-1">
            Manage your password and security preferences
          </p>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center justify-between py-3">
            <div>
              <label className="text-sm font-medium text-text">Password</label>
              <p className="text-sm text-muted-text">
                Keep your account secure with a strong password
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(true)}
              disabled={isUpdating}
            >
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Account Actions Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text">Account Status</h3>
          </div>
          <p className="text-sm text-muted-text mt-1">
            Information about your account verification
          </p>
        </div>
        <div className="px-6 py-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <label className="text-sm font-medium text-text">Email Verification</label>
                <p className="text-sm text-muted-text">
                  {profile?.email_verified
                    ? 'Your email is verified'
                    : 'Your email needs verification for full account access'}
                </p>
              </div>
              {profile?.email_verified ? (
                <div className="flex items-center gap-2 text-green-600">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Contact Support
                </Button>
              )}
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

      {/* Change Password Modal */}
      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </div>
  );
}
