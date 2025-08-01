'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { RootState } from '@/store';
import { Button } from '@/components/ui/button';
import {
  BellIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';

interface EmailStatus {
  pending_notifications: number;
  last_cron_run: string | null;
  recent_activity: any[];
  status: 'idle' | 'active' | 'stale';
  timestamp: string;
}

export default function NotificationSettings() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [processing, setProcessing] = useState(false);
  const [lastProcessed, setLastProcessed] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<{ success: boolean; message: string } | null>(
    null,
  );
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch email notification status
  const fetchEmailStatus = async () => {
    setStatusLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_email_notification_status');

      if (error) {
        console.error('Failed to fetch email status:', error);
        return;
      }

      setEmailStatus(data);
    } catch (error) {
      console.error('Error fetching email status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  // Load status on component mount
  useEffect(() => {
    fetchEmailStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchEmailStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualProcess = async () => {
    setProcessing(true);
    setProcessResult(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('manual_trigger_email_notifications');

      if (error) {
        setProcessResult({ success: false, message: error.message });
        return;
      }

      if (data.success) {
        setProcessResult({ success: true, message: data.message });
        setLastProcessed(new Date().toLocaleString());
        // Refresh status after processing
        setTimeout(fetchEmailStatus, 2000);
      } else {
        setProcessResult({ success: false, message: data.error || 'Processing failed' });
      }
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

  const notificationTypes = [
    {
      title: 'Job Permission Granted',
      description: 'Notify team members when they gain access to a job',
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Job Permission Revoked',
      description: 'Notify team members when their job access is removed',
      icon: XCircleIcon,
      color: 'text-red-600 bg-red-100',
    },
    {
      title: 'Invite Accepted',
      description: 'Notify inviters when team invitations are accepted',
      icon: CheckCircleIcon,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Invite Rejected',
      description: 'Notify inviters when team invitations are declined',
      icon: XCircleIcon,
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <BellIcon className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Email Notifications</h2>
          <p className="text-sm text-gray-600">
            Manage team notification settings and email delivery
          </p>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">System Status</h3>
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
                    <h4 className="font-medium text-gray-900 capitalize">{emailStatus.status}</h4>
                    <p className="text-sm text-gray-600">
                      {emailStatus.pending_notifications} pending notification
                      {emailStatus.pending_notifications !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
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
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Recent Activity</h5>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {emailStatus.recent_activity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
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
            <div className="text-center py-4 text-gray-500">Loading system status...</div>
          )}
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-medium text-gray-900">Available Notifications</h3>
          <p className="text-sm text-gray-600 mt-1">
            These notifications are automatically sent when team events occur
          </p>
        </div>
        <div className="divide-y">
          {notificationTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <div key={index} className="p-6 flex items-start space-x-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${type.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{type.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Enabled
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Processing */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h3 className="font-medium text-gray-900">Manual Processing</h3>
            <p className="text-sm text-gray-600 mt-1">
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
                  <h4 className="font-medium text-gray-900">Process Email Queue</h4>
                  <p className="text-sm text-gray-600">
                    Manually trigger processing of pending email notifications
                  </p>
                  {lastProcessed && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
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

            {/* Result Display */}
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
      )}
    </div>
  );
}
