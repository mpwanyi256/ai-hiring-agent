'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState, useAppDispatch } from '@/store';
import { fetchPlatformStats } from '@/store/admin/adminThunks';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { User } from '@/types';
import { PlatformStatsCards } from '@/components/admin/PlatformStatsCards';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';
import { PlatformOverview } from '@/components/admin/PlatformOverview';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };
  const { platformStats, isLoading, error } = useSelector((state: RootState) => state.admin);

  // Initialize analytics tracking
  useAnalytics();

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(fetchPlatformStats());
    }
  }, [dispatch, user]);

  // Don't render if not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Monitor platform performance and manage system-wide settings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                Administrator
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading platform stats</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Platform Statistics */}
        <PlatformStatsCards stats={platformStats} isLoading={isLoading} />

        {/* Quick Actions */}
        <AdminQuickActions
          onRefreshStats={() => dispatch(fetchPlatformStats())}
          onManageSubscriptions={() => router.push('/admin/subscriptions')}
        />

        {/* Platform Overview */}
        <PlatformOverview stats={platformStats} />
      </div>
    </DashboardLayout>
  );
}
