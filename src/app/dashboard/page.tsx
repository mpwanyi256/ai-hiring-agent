'use client';

import { useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import InsightCard from '@/components/dashboard/InsightCard';
import QuickActionCard from '@/components/dashboard/QuickActionCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import UpcomingInterviewsWidget from '@/components/dashboard/UpcomingInterviewsWidget';
import CandidatePipelineWidget from '@/components/dashboard/CandidatePipelineWidget';
import { RootState, useAppSelector } from '@/store';
import { User } from '@/types';
import {
  PlusIcon,
  BriefcaseIcon,
  UserGroupIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  EyeIcon,
  DocumentTextIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { app } from '@/lib/constants';
import { MetricCardSkeleton } from '@/components/dashboard/MetricCard';
import { InsightCardSkeleton } from '@/components/dashboard/InsightCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardUserPlanCard } from '@/components/dashboard/DashboardUserPlanCard';
import { DashboardSubscriptionMessage } from '@/components/dashboard/DashboardSubscriptionMessage';
import { selectHasActiveSubscription } from '@/store/auth/authSelectors';
import { useAppDispatch } from '@/store';
import { fetchDashboardMetrics } from '@/store/dashboard/dashboardThunks';
import { selectDashboardMetrics, selectMetricsLoading } from '@/store/dashboard/dashboardSlice';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };
  const [loading, setLoading] = useState(true);
  const [showInviteWelcome, setShowInviteWelcome] = useState(false);
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);

  // Initialize analytics tracking
  useAnalytics();

  // Subscription guard - redirect to pricing if no active subscription
  const { isSubscriptionValid } = useSubscriptionGuard({
    allowTrialing: true,
    bypassFor: ['admin', 'hr'], // Allow admins and HR to access dashboard
  });

  // Dashboard metrics state
  const metrics = useAppSelector(selectDashboardMetrics);
  const metricsLoading = useAppSelector(selectMetricsLoading);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Check for invite welcome parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('welcome') === 'invite') {
      setShowInviteWelcome(true);
      // Clean up the URL
      router.replace('/dashboard');
    }
  }, [router]);

  // Fetch dashboard metrics
  useEffect(() => {
    if (user && user.companyId) {
      dispatch(fetchDashboardMetrics());
    }
  }, [dispatch, user]);

  if (!user) return null;

  // Don't render dashboard content if subscription is invalid (guard will redirect)
  if (!isSubscriptionValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const interviewStats = [
    { label: 'This Week', value: 15, color: '#8B5CF6' },
    { label: 'Last Week', value: 12, color: '#EC4899' },
    { label: 'This Month', value: user.usageCounts.interviewsThisMonth, color: '#14B8A6' },
  ];

  return (
    <DashboardLayout>
      {/* Success Message */}
      <DashboardSubscriptionMessage />

      {/* Invite Welcome Message */}
      {showInviteWelcome && (
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-lg border border-green-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserGroupIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🎉 Welcome to the team!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your account has been successfully created and you&apos;re now part of{' '}
                {user.companyName}. You can now collaborate on hiring and access all team features.
              </p>
              <button
                onClick={() => setShowInviteWelcome(false)}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Got it, thanks!
              </button>
            </div>
            <button
              onClick={() => setShowInviteWelcome(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <DashboardHeader />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Active Jobs"
              value={user.usageCounts.activeJobs}
              subtitle={
                hasActiveSubscription ? `of ${user.subscription?.maxJobs}` : 'No active plan'
              }
              icon={BriefcaseIcon}
              progress={{
                current: user.usageCounts.activeJobs,
                max: user.subscription?.maxJobs || 1,
                label: 'Jobs used',
              }}
              onClick={() => router.push('/dashboard/jobs')}
            />

            <MetricCard
              title="Interviews"
              value={user.usageCounts.interviewsThisMonth}
              subtitle="This month"
              icon={UserGroupIcon}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-50"
              trend={{
                value: 15,
                isPositive: true,
                label: 'vs last month',
              }}
              progress={{
                current: hasActiveSubscription ? user.usageCounts.interviewsThisMonth : 0,
                max: hasActiveSubscription ? user.subscription?.maxInterviewsPerMonth || 1 : 0,
                label: 'Monthly limit',
              }}
            />
            {/* Candidates metric */}
            {metricsLoading ? (
              <MetricCardSkeleton />
            ) : (
              <MetricCard
                title="Candidates"
                value={metrics?.candidates?.total || 0}
                subtitle="All time"
                icon={UsersIcon}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-50"
                trend={{
                  value: metrics?.candidates?.trend?.value || 0,
                  isPositive: metrics?.candidates?.trend?.isPositive || true,
                  label: metrics?.candidates?.trend?.label || 'this week',
                }}
                onClick={() => router.push('/dashboard/candidates')}
              />
            )}

            {/* Average response time metric */}
            {metricsLoading ? (
              <MetricCardSkeleton />
            ) : (
              <MetricCard
                title="Avg. Response Time"
                value={metrics?.responseTime?.formattedTime || '0h'}
                subtitle="To complete interview"
                icon={ClockIcon}
                iconColor="text-emerald-600"
                iconBgColor="bg-emerald-50"
                trend={{
                  value: metrics?.responseTime?.trend?.value || 0,
                  isPositive: metrics?.responseTime?.trend?.isPositive || true,
                  label: metrics?.responseTime?.trend?.label || 'vs last week',
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DashboardUserPlanCard />

              <QuickActionCard
                title="Review Candidates"
                description="View pending candidate evaluations and interviews"
                icon={EyeIcon}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-50"
                buttonText="Review Applications"
                buttonVariant="outline"
                href="/dashboard/candidates"
              />

              <QuickActionCard
                title="Job Performance"
                description="Analyze your job posting performance and metrics"
                icon={ChartBarIcon}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-50"
                buttonText="View Reports"
                buttonVariant="outline"
                href="/dashboard/reports"
              />

              <QuickActionCard
                title="Share Interview Link"
                description="Get shareable links for your active job positions"
                icon={DocumentTextIcon}
                iconColor="text-emerald-600"
                iconBgColor="bg-emerald-50"
                buttonText="Get Links"
                buttonVariant="outline"
                href="/dashboard/jobs"
              />
            </div>
          </div>

          {/* Insights Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CandidatePipelineWidget />
            {loading ? (
              <InsightCardSkeleton />
            ) : (
              <InsightCard
                title="Interview Activity"
                subtitle="Recent interview volume"
                data={interviewStats}
                type="chart"
                icon={ChartBarIcon}
                action={{
                  label: 'Detailed Report',
                  onClick: () => router.push('/dashboard/reports'),
                }}
              />
            )}
          </div>

          {/* Getting Started Section for New Users */}
          {user.usageCounts.activeJobs === 0 && (
            <div className="bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50 rounded-lg border border-primary/10 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    🚀 Welcome to {app.name}!
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Get started by creating your first job post. Our AI will handle candidate
                    interviews and provide detailed evaluations.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                        1
                      </div>
                      <span className="text-xs text-gray-700">Create job post</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                        2
                      </div>
                      <span className="text-xs text-gray-700">Share interview link</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                        3
                      </div>
                      <span className="text-xs text-gray-700">Review AI evaluations</span>
                    </div>
                  </div>

                  <Link href="/dashboard/jobs/new">
                    <Button size="sm" className="text-xs">
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Create Your First Job
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Upcoming Interviews */}
        <div className="space-y-6">
          <UpcomingInterviewsWidget />
          {/* Recent Activity */}
          <InsightCard
            title="Recent Activity"
            subtitle="Latest hiring events"
            icon={ClockIcon}
            action={{
              label: 'View All',
              onClick: () => router.push('/dashboard/history'),
            }}
          >
            <RecentActivity maxItems={4} />
          </InsightCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
