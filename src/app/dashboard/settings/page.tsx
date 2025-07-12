'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { User } from '@/types';
import {
  BuildingOfficeIcon,
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  KeyIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  comingSoon?: boolean;
}

function SettingsCard({
  title,
  description,
  icon: Icon,
  href,
  comingSoon = false,
}: SettingsCardProps) {
  const CardContent = (
    <div className="flex items-center justify-between p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {comingSoon && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            Coming Soon
          </span>
        )}
        <ArrowRightIcon className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );

  if (comingSoon) {
    return <div className="cursor-not-allowed opacity-60">{CardContent}</div>;
  }

  return (
    <Link href={href} className="block">
      {CardContent}
    </Link>
  );
}

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };

  if (!user) return null;

  const settingsSections = [
    {
      title: 'Company Profile',
      description: 'Manage your company information, logo, and branding',
      icon: BuildingOfficeIcon,
      href: '/dashboard/settings/company',
    },
    {
      title: 'Personal Profile',
      description: 'Update your personal information and preferences',
      icon: UserIcon,
      href: '/dashboard/settings/profile',
      comingSoon: true,
    },
    {
      title: 'Security & Privacy',
      description: 'Manage your account security and privacy settings',
      icon: ShieldCheckIcon,
      href: '/dashboard/settings/security',
      comingSoon: true,
    },
    {
      title: 'Notifications',
      description: 'Configure email and in-app notification preferences',
      icon: BellIcon,
      href: '/dashboard/settings/notifications',
      comingSoon: true,
    },
    {
      title: 'API Keys',
      description: 'Manage API keys for integrations and automation',
      icon: KeyIcon,
      href: '/dashboard/settings/api-keys',
      comingSoon: true,
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600">Manage your account and company preferences</p>
      </div>

      {/* Settings Grid */}
      <div className="space-y-4">
        {settingsSections.map((section) => (
          <SettingsCard
            key={section.href}
            title={section.title}
            description={section.description}
            icon={section.icon}
            href={section.href}
            comingSoon={section.comingSoon}
          />
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-sm text-gray-600 mb-4">
          If you need assistance with any settings or have questions about your account, please
          don&apos;t hesitate to contact our support team.
        </p>
        <div className="flex items-center space-x-4">
          <Link
            href="mailto:support@example.com"
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            Contact Support
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/help" className="text-sm text-gray-600 hover:text-gray-800">
            Help Center
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
