import React from 'react';

const TABS = [
  { label: 'Member', key: 'member' },
  { label: 'Invitation', key: 'invitation' },
];

export default function TeamTabs({
  activeTab,
  setActiveTab,
  invitesCount,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  invitesCount: number;
}) {
  return (
    <div className="flex border-b border-gray-200 mb-4">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
            activeTab === tab.key
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-primary'
          }`}
          onClick={() => setActiveTab(tab.key)}
        >
          {tab.label}
          {tab.key === 'invitation' && invitesCount > 0 && (
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {invitesCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
