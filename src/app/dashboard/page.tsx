'use client';

import { useSelector } from 'react-redux';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { RootState } from '@/store';
import { User } from '@/store/slices/authSlice';
import { 
  PlusIcon,
  BriefcaseIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };

  if (!user) return null; // DashboardLayout handles loading/auth

  const isFreeTier = user.subscription?.name === 'free';
  const usagePercentage = user.subscription ? 
    (user.usageCounts.activeJobs / user.subscription.maxJobs) * 100 : 0;
  const interviewUsagePercentage = user.subscription ? 
    (user.usageCounts.interviewsThisMonth / user.subscription.maxInterviewsPerMonth) * 100 : 0;

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">
          Welcome back, {user.firstName}! 👋
        </h1>
        <p className="text-muted-text text-lg">
          Ready to find your next great hire? Let&apos;s get started.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Active Jobs */}
        <div className="bg-white rounded-lg border border-gray-light p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Active Jobs</p>
                <p className="text-2xl font-bold text-text">{user.usageCounts.activeJobs}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-text">
                {user.subscription?.maxJobs === 999 ? 'Unlimited' : `${user.subscription?.maxJobs} max`}
              </p>
              {user.subscription && user.subscription.maxJobs !== 999 && (
                <div className="w-16 bg-gray-light rounded-full h-2 mt-1">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interviews This Month */}
        <div className="bg-white rounded-lg border border-gray-light p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-blue/10 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-accent-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Interviews</p>
                <p className="text-2xl font-bold text-text">{user.usageCounts.interviewsThisMonth}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-text">This month</p>
              {user.subscription && user.subscription.maxInterviewsPerMonth !== 999 && (
                <div className="w-16 bg-gray-light rounded-full h-2 mt-1">
                  <div 
                    className="bg-accent-blue h-2 rounded-full"
                    style={{ width: `${Math.min(interviewUsagePercentage, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-lg border border-gray-light p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-teal/10 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-accent-teal" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Current Plan</p>
                <p className="text-lg font-bold text-text capitalize">
                  {user.subscription?.name || 'Free'} Tier
                </p>
              </div>
            </div>
            {isFreeTier && (
              <Link href="/dashboard/billing">
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-light p-8 mb-8">
        <h2 className="text-xl font-bold text-text mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create New Job */}
          <Link href="/dashboard/jobs/new" className="block">
            <div className="border border-gray-light rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <PlusIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">Create New Job</h3>
                    <p className="text-sm text-muted-text">Start hiring for a new position</p>
                  </div>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-muted-text" />
              </div>
              <Button className="w-full">
                Create Job Post
              </Button>
            </div>
          </Link>

          {/* View All Jobs */}
          <Link href="/dashboard/jobs" className="block">
            <div className="border border-gray-light rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-accent-blue/10 rounded-lg flex items-center justify-center">
                    <BriefcaseIcon className="w-6 h-6 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">Manage Jobs</h3>
                    <p className="text-sm text-muted-text">View and edit your job posts</p>
                  </div>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-muted-text" />
              </div>
              <Button variant="outline" className="w-full">
                View All Jobs
              </Button>
            </div>
          </Link>
        </div>
      </div>

      {/* Getting Started (for new users) */}
      {user.usageCounts.activeJobs === 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-accent-blue/5 rounded-lg border border-primary/20 p-8">
          <h2 className="text-xl font-bold text-text mb-4">🚀 Let&apos;s get you started!</h2>
          <p className="text-muted-text mb-6">
            Welcome to AI Hiring Agent! Here&apos;s how to post your first job and start interviewing candidates:
          </p>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-text">Create your first job post</p>
                <p className="text-sm text-muted-text">Add job title, requirements, and preferences</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-text">Share your interview link</p>
                <p className="text-sm text-muted-text">Send the AI interview link to candidates</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-text">Review AI evaluations</p>
                <p className="text-sm text-muted-text">Get scored reports and candidate insights</p>
              </div>
            </div>
          </div>

          <Link href="/dashboard/jobs/new">
            <Button size="lg">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Job
            </Button>
          </Link>
        </div>
      )}

      {/* Free Tier Limitation Notice */}
      {isFreeTier && user.usageCounts.activeJobs > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-2">You&apos;re on the Free plan</h3>
              <p className="text-amber-700 text-sm mb-4">
                Upgrade to Pro to unlock more jobs, advanced AI features, and detailed analytics.
              </p>
              <Link href="/dashboard/billing">
                <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 