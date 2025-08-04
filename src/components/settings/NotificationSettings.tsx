'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  BellIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/providers/ToastProvider';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '@/store/settings/settingsThunks';
import {
  selectNotificationPreferences,
  selectIsProfileUpdating,
  selectSettingsError,
} from '@/store/settings/settingsSelectors';
import { NotificationPreferences } from '@/store/settings/settingsSlice';

interface EmailStatus {
  pending_notifications: number;
  last_cron_run: string | null;
  recent_activity: any[];
  status: 'idle' | 'active' | 'stale';
  timestamp: string;
}

export default function NotificationSettings() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { success, error } = useToast();
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(selectNotificationPreferences);
  const isUpdating = useAppSelector(selectIsProfileUpdating);
  const settingsError = useAppSelector(selectSettingsError);

  // Admin features state
  const [processing, setProcessing] = useState(false);
  const [lastProcessed, setLastProcessed] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<{ success: boolean; message: string } | null>(
    null,
  );
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // User preferences state
  const [preferencesLoading, setPreferencesLoading] = useState(true);

  // Fetch user notification preferences
  const fetchUserPreferences = async () => {
    if (!user?.id) return;

    setPreferencesLoading(true);
    try {
      await dispatch(fetchNotificationPreferences()).unwrap();
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Save user notification preferences
  const saveUserPreferences = async (updatedPreferences: Partial<NotificationPreferences>) => {
    if (!user?.id) return;

    try {
      await dispatch(updateNotificationPreferences(updatedPreferences)).unwrap();
      success('Notification preferences saved successfully');
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      error('Failed to save notification preferences');
    }
  };

  // Fetch email notification status (admin only)
  const fetchEmailStatus = async () => {
    if (user?.role !== 'admin') return;

    setStatusLoading(true);
    try {
      // This function is no longer directly fetching from the database,
      // but rather relies on the backend to manage its own status.
      // For now, we'll keep the structure but acknowledge this.
      // In a real scenario, you might call a specific API endpoint for status.
      // For example: const { data, error } = await supabase.rpc('get_email_notification_status');
      // This part of the logic needs to be re-evaluated based on your backend's status endpoint.
      // For now, we'll simulate a status update or remove if not directly applicable.
      // setEmailStatus(data); // This line was removed as per the new_code
    } catch (error) {
      console.error('Error fetching email status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  // Load preferences and status on component mount
  useEffect(() => {
    fetchUserPreferences();
    if (user?.role === 'admin') {
      fetchEmailStatus();
      const interval = setInterval(fetchEmailStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleManualProcess = async () => {
    setProcessing(true);
    setProcessResult(null);

    try {
      // This function is no longer directly triggering a manual process,
      // but rather relies on the backend to manage its own queue.
      // For now, we'll keep the structure but acknowledge this.
      // In a real scenario, you might call a specific API endpoint for processing.
      // For example: const { data, error } = await supabase.rpc('manual_trigger_email_notifications');
      // This part of the logic needs to be re-evaluated based on your backend's processing endpoint.
      // For now, we'll simulate a process result or remove if not directly applicable.
      // setProcessResult({ success: true, message: 'Manual processing triggered' }); // This line was removed as per the new_code
      // setLastProcessed(new Date().toLocaleString()); // This line was removed as per the new_code
      // setTimeout(fetchEmailStatus, 2000); // This line was removed as per the new_code
    } catch (error) {
      setProcessResult({
        success: false,
        message: 'Failed to process notifications',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'idle':
        return 'text-blue-600 bg-blue-100';
      case 'stale':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircleIcon;
      case 'idle':
        return InformationCircleIcon;
      case 'stale':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  const notificationCategories = [
    {
      title: 'Job Applications',
      description: 'Notifications about new candidate applications',
      emailKey: 'email_job_applications' as keyof NotificationPreferences,
      pushKey: 'push_job_applications' as keyof NotificationPreferences,
      inAppKey: 'in_app_job_applications' as keyof NotificationPreferences,
    },
    {
      title: 'Interview Scheduling',
      description: 'Notifications when interviews are scheduled or rescheduled',
      emailKey: 'email_interview_scheduled' as keyof NotificationPreferences,
      pushKey: 'push_interview_scheduled' as keyof NotificationPreferences,
      inAppKey: 'in_app_interview_scheduled' as keyof NotificationPreferences,
    },
    {
      title: 'Interview Reminders',
      description: 'Reminders before upcoming interviews',
      emailKey: 'email_interview_reminders' as keyof NotificationPreferences,
      pushKey: 'push_interview_reminders' as keyof NotificationPreferences,
      inAppKey: null,
    },
    {
      title: 'Candidate Updates',
      description: 'Updates about candidate status changes and evaluations',
      emailKey: 'email_candidate_updates' as keyof NotificationPreferences,
      pushKey: 'push_candidate_updates' as keyof NotificationPreferences,
      inAppKey: 'in_app_candidate_updates' as keyof NotificationPreferences,
    },
    {
      title: 'System Updates',
      description: 'Important system announcements and feature updates',
      emailKey: 'email_system_updates' as keyof NotificationPreferences,
      pushKey: null,
      inAppKey: 'in_app_system_updates' as keyof NotificationPreferences,
    },
  ];

  if (preferencesLoading) {
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
        <h2 className="text-2xl font-bold text-text mb-2">Notifications</h2>
        <p className="text-muted-text">
          Manage your notification preferences and delivery settings.
        </p>
      </div>

      {/* User Notification Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BellIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text">Notification Preferences</h3>
          </div>
          <p className="text-sm text-muted-text mt-1">
            Choose how you want to receive notifications
          </p>
        </div>

        <div className="px-6 py-6">
          {/* Master Controls */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-text">Email Notifications</label>
                  <p className="text-sm text-muted-text">Receive notifications via email</p>
                </div>
              </div>
              <Switch
                checked={preferences?.email_enabled || false}
                onCheckedChange={(checked) => saveUserPreferences({ email_enabled: checked })}
                disabled={isUpdating}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-text">Push Notifications</label>
                  <p className="text-sm text-muted-text">
                    Receive push notifications on your devices
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.push_enabled || false}
                onCheckedChange={(checked) => saveUserPreferences({ push_enabled: checked })}
                disabled={isUpdating}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <ComputerDesktopIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-text">In-App Notifications</label>
                  <p className="text-sm text-muted-text">
                    Show notifications within the application
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.in_app_enabled || false}
                onCheckedChange={(checked) => saveUserPreferences({ in_app_enabled: checked })}
                disabled={isUpdating}
              />
            </div>
          </div>

          {/* Detailed Preferences */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-text">Notification Types</h4>

            {notificationCategories.map((category, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-6">
                <div className="mb-4">
                  <h5 className="font-medium text-text">{category.title}</h5>
                  <p className="text-sm text-muted-text">{category.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Email</span>
                    </div>
                    <Switch
                      checked={Boolean(
                        preferences?.[category.emailKey as keyof NotificationPreferences],
                      )}
                      onCheckedChange={(checked) =>
                        saveUserPreferences({ [category.emailKey]: checked })
                      }
                      disabled={isUpdating || !preferences?.email_enabled}
                    />
                  </div>

                  {/* Push */}
                  {category.pushKey && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DevicePhoneMobileIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Push</span>
                      </div>
                      <Switch
                        checked={Boolean(
                          preferences?.[category.pushKey as keyof NotificationPreferences],
                        )}
                        onCheckedChange={(checked) =>
                          saveUserPreferences({ [category.pushKey]: checked })
                        }
                        disabled={isUpdating || !preferences?.push_enabled}
                      />
                    </div>
                  )}

                  {/* In-App */}
                  {category.inAppKey && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ComputerDesktopIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">In-App</span>
                      </div>
                      <Switch
                        checked={Boolean(
                          preferences?.[category.inAppKey as keyof NotificationPreferences],
                        )}
                        onCheckedChange={(checked) =>
                          saveUserPreferences({ [category.inAppKey]: checked })
                        }
                        disabled={isUpdating || !preferences?.in_app_enabled}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Email Digest Frequency */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-text mb-4">Email Digest Frequency</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['immediate', 'hourly', 'daily', 'weekly'].map((frequency) => (
                <label key={frequency} className="flex items-center">
                  <input
                    type="radio"
                    name="email_digest_frequency"
                    value={frequency}
                    checked={preferences?.email_digest_frequency === frequency}
                    onChange={(e) =>
                      saveUserPreferences({ email_digest_frequency: e.target.value as any })
                    }
                    disabled={isUpdating}
                    className="mr-2 text-primary focus:ring-primary"
                  />
                  <span className="text-sm capitalize">{frequency}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Marketing Preferences */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-text">Marketing Communications</label>
                <p className="text-sm text-muted-text">
                  Receive updates about new features, tips, and promotional content
                </p>
              </div>
              <Switch
                checked={preferences?.email_marketing || false}
                onCheckedChange={(checked) => saveUserPreferences({ email_marketing: checked })}
                disabled={isUpdating}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Features */}
      {user?.role === 'admin' && (
        <>
          {/* System Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CogIcon className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-text">System Status</h3>
                </div>
                <button
                  onClick={fetchEmailStatus}
                  disabled={statusLoading}
                  className="text-sm text-primary hover:text-primary-dark disabled:opacity-50"
                >
                  {statusLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
            <div className="p-6">
              {emailStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(emailStatus.status)}`}
                      >
                        {React.createElement(getStatusIcon(emailStatus.status), {
                          className: 'w-5 h-5',
                        })}
                      </div>
                      <div>
                        <h4 className="font-medium text-text capitalize">{emailStatus.status}</h4>
                        <p className="text-sm text-muted-text">
                          {emailStatus.pending_notifications} pending notification
                          {emailStatus.pending_notifications !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-text">
                      <div>
                        Last run:{' '}
                        {emailStatus.last_cron_run
                          ? new Date(emailStatus.last_cron_run).toLocaleString()
                          : 'Never'}
                      </div>
                      <div>Updated: {new Date(emailStatus.timestamp).toLocaleString()}</div>
                    </div>
                  </div>

                  {emailStatus.recent_activity.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-text mb-2">Recent Activity</h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {emailStatus.recent_activity.slice(0, 5).map((activity, index) => (
                          <div
                            key={index}
                            className="text-xs text-muted-text bg-gray-50 p-2 rounded"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">{activity.event_type}</span>
                              <span>{new Date(activity.created_at).toLocaleTimeString()}</span>
                            </div>
                            <div>{activity.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-text">Loading system status...</div>
              )}
            </div>
          </div>

          {/* Manual Processing */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <PlayIcon className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-text">Manual Processing</h3>
              </div>
              <p className="text-sm text-muted-text mt-1">
                Process pending email notifications immediately
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <EnvelopeIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-text">Process Email Queue</h4>
                    <p className="text-sm text-muted-text">
                      Manually trigger processing of pending email notifications
                    </p>
                    {lastProcessed && (
                      <p className="text-xs text-muted-text mt-1 flex items-center space-x-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>Last processed: {lastProcessed}</span>
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleManualProcess}
                  disabled={processing}
                  isLoading={processing}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  {!processing && <PlayIcon className="w-4 h-4" />}
                  <span>{processing ? 'Processing...' : 'Process Now'}</span>
                </Button>
              </div>

              {processResult && (
                <div
                  className={`mt-4 p-3 rounded-lg border ${
                    processResult.success
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {processResult.success ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                      <XCircleIcon className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{processResult.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
