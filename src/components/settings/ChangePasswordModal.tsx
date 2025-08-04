import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/ToastProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import { changeUserPassword } from '@/store/settings/settingsThunks';
import { selectIsProfileUpdating, selectSettingsError } from '@/store/settings/settingsSelectors';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const dispatch = useAppDispatch();
  const { success, error } = useToast();
  const isLoading = useAppSelector(selectIsProfileUpdating);
  const apiError = useAppSelector(selectSettingsError);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setFormError('All fields are required');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setFormError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setFormError('New password must be at least 8 characters long');
      return;
    }

    try {
      await dispatch(
        changeUserPassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      ).unwrap();

      success('Password changed successfully');
      handleClose();
    } catch (err) {
      setFormError((err as string) || apiError || 'Failed to change password');
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
    setFormError(null);
    onClose();
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{formError}</p>
          </div>
        )}

        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-text mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="currentPassword"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
              placeholder="Enter your current password"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPasswords.current ? (
                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-text mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="newPassword"
              value={formData.newPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
              placeholder="Enter your new password"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPasswords.new ? (
                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-text mt-1">
            Password must be at least 8 characters long
          </p>
        </div>

        {/* Confirm New Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
              placeholder="Confirm your new password"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPasswords.confirm ? (
                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            Change Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
