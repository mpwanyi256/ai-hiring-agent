'use client';

import { useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import InsightCard from '@/components/dashboard/InsightCard';
import QuickActionCard from '@/components/dashboard/QuickActionCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { RootState } from '@/store';
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
  ArrowTrendingUpIcon,
  UsersIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };

  if (!user) return null;

  const isFreeTier = user.subscription?.name === 'free';
  const usagePercentage = user.subscription ? 
    (user.usageCounts.activeJobs / user.subscription.maxJobs) * 100 : 0;
  const interviewUsagePercentage = user.subscription ? 
    (user.usageCounts.interviewsThisMonth / user.subscription.maxInterviewsPerMonth) * 100 : 0;

  // Mock data for enhanced insights
  const candidatesByStatus = [
    { label: 'Shortlisted', value: 8, color: '#10B981' },
    { label: 'In Review', value: 12, color: '#F59E0B' },
    { label: 'Interviewed', value: 24, color: '#3B82F6' },
    { label: 'Applied', value: 35, color: '#6B7280' }
  ];

  const interviewStats = [
    { label: 'This Week', value: 15, color: '#8B5CF6' },
    { label: 'Last Week', value: 12, color: '#EC4899' },
    { label: 'This Month', value: user.usageCounts.interviewsThisMonth, color: '#14B8A6' }
  ];

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              Welcome back, {user.firstName}! 👋
            </h1>
            <p className="text-sm text-gray-600">
              Here&apos;s what&apos;s happening with your hiring today
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <CalendarDaysIcon className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}</span>
            </div>
            <Link href="/dashboard/jobs/new">
              <Button size="sm" className="text-xs">
                <PlusIcon className="w-4 h-4 mr-1" />
                New Job
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Active Jobs"
          value={user.usageCounts.activeJobs}
          subtitle={user.subscription?.maxJobs === -1 ? 'Unlimited' : `of ${user.subscription?.maxJobs}`}
          icon={BriefcaseIcon}
          progress={{
            current: user.usageCounts.activeJobs,
            max: user.subscription?.maxJobs || 1,
            label: 'Jobs used'
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
            label: 'vs last month'
          }}
          progress={{
            current: user.usageCounts.interviewsThisMonth,
            max: user.subscription?.maxInterviewsPerMonth || 1,
            label: 'Monthly limit'
          }}
        />

        <MetricCard
          title="Candidates"
          value={79}
          subtitle="All time"
          icon={UsersIcon}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
          trend={{
            value: 8,
            isPositive: true,
            label: 'this week'
          }}
          onClick={() => router.push('/dashboard/candidates')}
        />

        <MetricCard
          title="Avg. Response Time"
          value="2.3h"
          subtitle="To complete interview"
          icon={ClockIcon}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
          trend={{
            value: 12,
            isPositive: false,
            label: 'vs last week'
          }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickActionCard
                title="Create New Job"
                description="Post a new position and start interviewing candidates"
                icon={PlusIcon}
                buttonText="Create Job Post"
                href="/dashboard/jobs/new"
              />
              
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
            <InsightCard
              title="Candidate Pipeline"
              subtitle="Applications by status"
              data={candidatesByStatus}
              type="list"
              icon={ArrowTrendingUpIcon}
              action={{
                label: 'View All',
                onClick: () => router.push('/dashboard/candidates')
              }}
            />

            <InsightCard
              title="Interview Activity"
              subtitle="Recent interview volume"
              data={interviewStats}
              type="chart"
              icon={ChartBarIcon}
              action={{
                label: 'Detailed Report',
                onClick: () => router.push('/dashboard/reports')
              }}
            />
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
                    🚀 Welcome to AI Hiring Agent!
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Get started by creating your first job post. Our AI will handle candidate interviews and provide detailed evaluations.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                      <span className="text-xs text-gray-700">Create job post</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                      <span className="text-xs text-gray-700">Share interview link</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
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

        {/* Right Column - Activity & Plan */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <InsightCard
            title="Recent Activity"
            subtitle="Latest hiring events"
            icon={ClockIcon}
            action={{
              label: 'View All',
              onClick: () => router.push('/dashboard/history')
            }}
          >
            <RecentActivity maxItems={4} />
          </InsightCard>

          {/* Current Plan */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Current Plan</h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.subscription?.name || 'Free'} Tier
                  </p>
                </div>
              </div>
              {isFreeTier && (
                <Link href="/dashboard/billing">
                  <Button variant="outline" size="sm" className="text-xs">
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Jobs</span>
                <span className="font-medium text-gray-900">
                  {user.usageCounts.activeJobs}/{user.subscription?.maxJobs === -1 ? '∞' : user.subscription?.maxJobs}
                </span>
              </div>
              {user.subscription && user.subscription.maxJobs !== -1 && (
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              )}

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Interviews (Monthly)</span>
                <span className="font-medium text-gray-900">
                  {user.usageCounts.interviewsThisMonth}/{user.subscription?.maxInterviewsPerMonth === -1 ? '∞' : user.subscription?.maxInterviewsPerMonth}
                </span>
              </div>
              {user.subscription && user.subscription.maxInterviewsPerMonth !== -1 && (
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(interviewUsagePercentage, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {isFreeTier && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-800 mb-2 font-medium">Free Plan Benefits</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• 1 active job</li>
                  <li>• 5 interviews per month</li>
                  <li>• Basic AI evaluations</li>
                </ul>
                <Link href="/dashboard/billing" className="block mt-2">
                  <Button size="sm" variant="outline" className="w-full text-xs border-amber-200 text-amber-700 hover:bg-amber-100">
                    Upgrade for More
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 