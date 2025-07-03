'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useState } from 'react';
import {
  HomeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CreditCardIcon,
  CogIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface ChildRoute {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: number;
  children?: ChildRoute[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ collapsed, onToggleCollapse, onClose, isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemName: string) => {
    if (collapsed && !isMobile) return; // Don't expand in collapsed desktop mode
    
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isExpanded = (itemName: string) => expandedItems.includes(itemName);

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      description: 'Overview and quick actions',
    },
    {
      name: 'Jobs',
      href: '/dashboard/jobs',
      icon: BriefcaseIcon,
      description: 'Manage job postings',
      badge: user?.usageCounts?.activeJobs || 0,
      children: [
        { name: 'All Jobs', href: '/dashboard/jobs', icon: BriefcaseIcon, description: 'View all job postings' },
        { name: 'Create Job', href: '/dashboard/jobs/new', icon: PlusIcon, description: 'Post a new job' },
        { name: 'Templates', href: '/dashboard/jobs/templates', icon: DocumentTextIcon, description: 'Job templates' },
      ]
    },
    {
      name: 'Candidates',
      href: '/dashboard/candidates',
      icon: UserGroupIcon,
      description: 'Review applications',
      badge: 12, // TODO: Get from actual data
      children: [
        { name: 'All Candidates', href: '/dashboard/candidates', icon: UserGroupIcon, description: 'View all candidates' },
        { name: 'Shortlisted', href: '/dashboard/candidates/shortlisted', icon: UserIcon, description: 'Top candidates' },
        { name: 'In Review', href: '/dashboard/candidates/review', icon: EyeIcon, description: 'Pending review' },
      ]
    },
    {
      name: 'Reports',
      href: '/dashboard/reports',
      icon: ChartBarIcon,
      description: 'Analytics and insights',
      children: [
        { name: 'Performance', href: '/dashboard/reports/performance', icon: ChartBarIcon, description: 'Hiring metrics' },
        { name: 'Candidate Analytics', href: '/dashboard/reports/candidates', icon: UserGroupIcon, description: 'Application insights' },
        { name: 'Export Data', href: '/dashboard/reports/export', icon: DocumentTextIcon, description: 'Download reports' },
      ]
    },
    {
      name: 'History',
      href: '/dashboard/history',
      icon: ClockIcon,
      description: 'Interview records',
      children: [
        { name: 'All Interviews', href: '/dashboard/history', icon: ClockIcon, description: 'Complete history' },
        { name: 'Recent', href: '/dashboard/history/recent', icon: ClockIcon, description: 'Last 30 days' },
      ]
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCardIcon,
      description: 'Subscription and usage',
      children: [
        { name: 'Current Plan', href: '/dashboard/billing', icon: CreditCardIcon, description: 'Plan details' },
        { name: 'Usage', href: '/dashboard/billing/usage', icon: ChartBarIcon, description: 'Usage statistics' },
        { name: 'Invoices', href: '/dashboard/billing/invoices', icon: DocumentTextIcon, description: 'Billing history' },
        { name: 'Upgrade', href: '/dashboard/billing/upgrade', icon: SparklesIcon, description: 'Upgrade plan' },
      ]
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: CogIcon,
      description: 'Account preferences',
      children: [
        { name: 'Profile', href: '/dashboard/settings/profile', icon: UserIcon, description: 'Personal information' },
        { name: 'Company', href: '/dashboard/settings/company', icon: BriefcaseIcon, description: 'Company details' },
        { name: 'Notifications', href: '/dashboard/settings/notifications', icon: BellIcon, description: 'Email preferences' },
        { name: 'API Keys', href: '/dashboard/settings/api', icon: CogIcon, description: 'Integration settings' },
      ]
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (item: NavigationItem) => {
    return item.children?.some(child => isActive(child.href)) || false;
  };

  // Auto-expand items with active children
  React.useEffect(() => {
    navigation.forEach(item => {
      if (hasActiveChild(item) && !isExpanded(item.name)) {
        setExpandedItems(prev => [...prev, item.name]);
      }
    });
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`bg-white border-r border-surface flex flex-col h-full ${
      collapsed && !isMobile ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface">
        {(!collapsed || isMobile) && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-text text-sm">{user?.companyName}</h2>
              <p className="text-xs text-muted-text capitalize">
                {user?.subscription?.name || 'Free'} Plan
              </p>
            </div>
          </div>
        )}
        
        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-text hover:text-text hover:bg-gray-50"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isItemActive = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const itemExpanded = isExpanded(item.name);
          const hasActiveChildren = hasActiveChild(item);

          return (
            <div key={item.name}>
              {/* Main Navigation Item */}
              <div
                className={`group flex items-center rounded-lg transition-all duration-200 ${
                  isItemActive || hasActiveChildren
                    ? 'bg-primary/8 text-primary shadow-sm border border-primary/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Link
                  href={item.href}
                  onClick={() => isMobile && onClose()}
                  className={`flex items-center flex-1 p-2.5 rounded-lg transition-all ${
                    collapsed && !isMobile ? 'justify-center' : ''
                  }`}
                >
                  <item.icon className={`flex-shrink-0 ${
                    collapsed && !isMobile ? 'w-5 h-5' : 'w-4 h-4'
                  } ${isItemActive || hasActiveChildren ? 'text-primary' : ''}`} />
                  
                  {(!collapsed || isMobile) && (
                    <>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs opacity-70 truncate mt-0.5">{item.description}</p>
                      </div>
                      
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                          isItemActive || hasActiveChildren 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>

                {/* Expand/Collapse Button for items with children */}
                {hasChildren && (!collapsed || isMobile) && (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className="p-1.5 rounded-md hover:bg-white/50 mr-2 transition-colors"
                  >
                    {itemExpanded ? (
                      <ChevronDownIcon className="w-3 h-3" />
                    ) : (
                      <ChevronRightIcon className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>

              {/* Child Navigation Items */}
              {hasChildren && itemExpanded && (!collapsed || isMobile) && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-100 pl-3">
                  {item.children!.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => isMobile && onClose()}
                      className={`flex items-center p-2 rounded-md text-sm transition-colors group ${
                        isActive(child.href)
                          ? 'bg-primary/5 text-primary border-l-2 border-primary ml-[-14px] pl-3'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {child.icon && <child.icon className="w-3 h-3 mr-2 flex-shrink-0 opacity-60" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-xs">{child.name}</p>
                        {child.description && (
                          <p className="text-xs opacity-60 truncate">{child.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Usage Stats Footer */}
      {(!collapsed || isMobile) && user?.subscription && (
        <div className="p-3 border-t border-gray-100">
          <div className="bg-gradient-to-r from-primary/3 to-blue-50 rounded-lg p-3 border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-xs">
                {user.subscription.name} Plan
              </h3>
              {user.subscription.name === 'free' && (
                <Link
                  href="/dashboard/billing/upgrade"
                  className="text-xs text-primary hover:text-primary-light font-medium"
                >
                  Upgrade
                </Link>
              )}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Jobs</span>
                <span className="font-medium text-gray-900">
                  {user.usageCounts.activeJobs}/{user.subscription.maxJobs === -1 ? '∞' : user.subscription.maxJobs}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interviews</span>
                <span className="font-medium text-gray-900">
                  {user.usageCounts.interviewsThisMonth}/{user.subscription.maxInterviewsPerMonth === -1 ? '∞' : user.subscription.maxInterviewsPerMonth}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Mode Tooltip */}
      {collapsed && !isMobile && (
        <div className="p-2">
          <button
            onClick={onToggleCollapse}
            className="w-full p-2 rounded-lg text-muted-text hover:text-text hover:bg-gray-50 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRightIcon className="w-5 h-5 mx-auto" />
          </button>
        </div>
      )}
    </div>
  );
} 