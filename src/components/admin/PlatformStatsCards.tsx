import React from 'react';
import MetricCard from '@/components/dashboard/MetricCard';
import { PlatformStats } from '@/types/admin';
import {
  UsersIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  DocumentCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface PlatformStatsCardsProps {
  stats: PlatformStats | null;
  isLoading: boolean;
}

export const PlatformStatsCards: React.FC<PlatformStatsCardsProps> = ({ stats, isLoading }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={UsersIcon}
          trend={{
            value: stats?.newUsersThisMonth || 0,
            isPositive: true,
            label: 'new this month',
          }}
          iconBgColor="bg-blue-50"
        />

        <MetricCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          icon={DocumentCheckIcon}
          iconBgColor="bg-green-50"
        />

        <MetricCard
          title="Monthly Revenue"
          value={`$${stats?.totalRevenue || 0}`}
          icon={CurrencyDollarIcon}
          iconBgColor="bg-emerald-50"
        />

        <MetricCard
          title="Total Companies"
          value={stats?.totalCompanies || 0}
          icon={BuildingOfficeIcon}
          iconBgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Jobs"
          value={stats?.activeJobs || 0}
          icon={BriefcaseIcon}
          iconBgColor="bg-indigo-50"
        />

        <MetricCard
          title="Completed Interviews"
          value={stats?.completedInterviews || 0}
          icon={CalendarDaysIcon}
          iconBgColor="bg-orange-50"
        />

        <MetricCard
          title="Total Candidates"
          value={stats?.totalCandidates || 0}
          icon={UserGroupIcon}
          iconBgColor="bg-pink-50"
        />

        <MetricCard
          title="Platform Health"
          value="Excellent"
          icon={ChartBarIcon}
          iconBgColor="bg-green-50"
        />
      </div>
    </>
  );
};
