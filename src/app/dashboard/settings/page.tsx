'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import { RootState } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { User } from '@/types';
import TabNavigation from '@/components/ui/TabNavigation';
import GeneralTab from '@/components/settings/GeneralTab';
import AccountTab from '@/components/settings/AccountTab';
import BillingTab from '@/components/settings/BillingTab';
import ProfileTab from '@/components/settings/ProfileTab';
import ConnectedAccountsTab from '@/components/settings/ConnectedAccountsTab';
import NotificationSettings from '@/components/settings/NotificationSettings';

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'account', label: 'Account' },
  { id: 'billing', label: 'Billing' },
  { id: 'profile', label: 'Profile' },
  { id: 'connected', label: 'Connected Accounts' },
  { id: 'notifications', label: 'Notifications' },
];

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState(() => {
    return searchParams.get('tab') || 'general';
  });

  // Update active tab when URL changes
  React.useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabs.some((tab) => tab.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600">Manage your account and company preferences</p>
      </div>
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'account' && <AccountTab />}
        {activeTab === 'billing' && <BillingTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'connected' && <ConnectedAccountsTab />}
        {activeTab === 'notifications' && <NotificationSettings />}
      </div>
    </DashboardLayout>
  );
}
