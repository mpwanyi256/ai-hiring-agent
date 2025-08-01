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
  CogIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  DocumentTextIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import BillingButton from '@/components/billing/BillingButton';
import { useSubscriptionModal } from '@/components/modals/SubscriptionModal';
import { selectHasActiveSubscription } from '@/store/auth/authSelectors';

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
  onSubscribeClick?: () => void;
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  onClose,
  isMobile = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { open: openSubscriptionModal } = useSubscriptionModal() || {};
  const hasActiveSubscription = useSelector(selectHasActiveSubscription);

  const toggleExpanded = (itemName: string) => {
    if (collapsed && !isMobile) return; // Don't expand in collapsed desktop mode

    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
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
        {
          name: 'All Jobs',
          href: '/dashboard/jobs',
          icon: BriefcaseIcon,
          description: 'View all job postings',
        },
        {
          name: 'Create Job',
          href: '/dashboard/jobs/new',
          icon: PlusIcon,
          description: 'Post a new job',
        },
        {
          name: 'Templates',
          href: '/dashboard/jobs/templates',
          icon: DocumentTextIcon,
          description: 'Job templates',
        },
      ],
    },
    // Add Teams navigation item here
    {
      name: 'Team',
      href: '/dashboard/teams',
      icon: UserGroupIcon,
      description: 'Manage your hiring team',
    },
    {
      name: 'Contracts',
      href: '/dashboard/contracts',
      icon: DocumentTextIcon,
      description: 'Contract templates and offers',
      children: [
        {
          name: 'Templates',
          href: '/dashboard/contracts',
          icon: DocumentTextIcon,
          description: 'Contract templates',
        },
        {
          name: 'Create Template',
          href: '/dashboard/contracts/new',
          icon: PlusIcon,
          description: 'New contract template',
        },
      ],
    },
    {
      name: 'Reports',
      href: '/dashboard/reports',
      icon: ChartBarIcon,
      description: 'Analytics and insights',
      children: [
        {
          name: 'Performance',
          href: '/dashboard/reports/performance',
          icon: ChartBarIcon,
          description: 'Hiring metrics',
        },
        {
          name: 'Candidate Analytics',
          href: '/dashboard/reports/candidates',
          icon: UserGroupIcon,
          description: 'Application insights',
        },
        {
          name: 'Export Data',
          href: '/dashboard/reports/export',
          icon: DocumentTextIcon,
          description: 'Download reports',
        },
      ],
    },
    {
      name: 'History',
      href: '/dashboard/history',
      icon: ClockIcon,
      description: 'Interview records',
      children: [
        {
          name: 'All Interviews',
          href: '/dashboard/history',
          icon: ClockIcon,
          description: 'Complete history',
        },
        {
          name: 'Recent',
          href: '/dashboard/history/recent',
          icon: ClockIcon,
          description: 'Last 30 days',
        },
      ],
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: CogIcon,
      description: 'Account preferences',
      children: [
        {
          name: 'General',
          href: '/dashboard/settings?tab=general',
          icon: CogIcon,
          description: 'Basic settings',
        },
        {
          name: 'Account',
          href: '/dashboard/settings?tab=account',
          icon: UserIcon,
          description: 'User account',
        },
        {
          name: 'Notifications',
          href: '/dashboard/settings?tab=notifications',
          icon: BellIcon,
          description: 'Email notifications',
        },
        {
          name: 'AI Models',
          href: '/dashboard/settings/ai-models',
          icon: SparklesIcon,
          description: 'AI models',
        },
      ],
    },
  ];

  // Admin navigation items (only visible to admin users)
  const adminNavigation: NavigationItem[] =
    user?.role === 'admin'
      ? [
          {
            name: 'Admin',
            href: '/admin',
            icon: ShieldCheckIcon,
            description: 'Platform administration',
            children: [
              {
                name: 'Dashboard',
                href: '/admin',
                icon: ChartBarIcon,
                description: 'Platform overview',
              },
              {
                name: 'Subscriptions',
                href: '/admin/subscriptions',
                icon: CreditCardIcon,
                description: 'Manage subscription plans',
              },
            ],
          },
        ]
      : [];

  // Combine navigation arrays
  const allNavigation = [...navigation, ...adminNavigation];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (item: NavigationItem) => {
    return item.children?.some((child) => isActive(child.href)) || false;
  };

  // Auto-expand items with active children
  React.useEffect(() => {
    allNavigation.forEach((item) => {
      if (hasActiveChild(item) && !isExpanded(item.name)) {
        setExpandedItems((prev) => [...prev, item.name]);
      }
    });
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-200 shadow-none ${
        collapsed && !isMobile ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {(!collapsed || isMobile) && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">{user?.companyName}</h2>
              <p className="text-xs text-gray-400 capitalize">
                {user?.subscription?.name || 'No active '} plan
              </p>
            </div>
          </div>
        )}
        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {allNavigation.map((item) => {
          const isItemActive = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const itemExpanded = isExpanded(item.name);
          const hasActiveChildren = hasActiveChild(item);

          return (
            <div key={item.name}>
              {/* Main Navigation Item */}
              <div
                className={`group flex items-center rounded-md transition-all duration-200 cursor-pointer ${
                  isItemActive || hasActiveChildren
                    ? 'bg-primary/5 text-primary shadow-none'
                    : 'text-gray-700 hover:text-primary hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <Link
                  href={item.href}
                  onClick={() => isMobile && onClose()}
                  className={`flex items-center flex-1 p-2.5 rounded-md transition-all ${
                    collapsed && !isMobile ? 'justify-center' : ''
                  }`}
                >
                  <item.icon
                    className={`flex-shrink-0 ${
                      collapsed && !isMobile ? 'w-6 h-6' : 'w-5 h-5'
                    } ${isItemActive || hasActiveChildren ? 'text-primary' : 'text-gray-400'}`}
                  />
                  {(!collapsed || isMobile) && (
                    <>
                      <span className="ml-3 font-medium text-sm truncate">{item.name}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isItemActive || hasActiveChildren
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
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
                    className="p-1.5 rounded-md hover:bg-gray-100 mr-2 transition-colors"
                  >
                    {itemExpanded ? (
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-gray-400" />
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
                          ? 'bg-primary/10 text-primary ml-[-14px] pl-3'
                          : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                      }`}
                    >
                      {child.icon && (
                        <child.icon className="w-4 h-4 mr-2 flex-shrink-0 opacity-60" />
                      )}
                      <span className="font-medium truncate text-xs">{child.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer: Usage Stats & User Info */}
      {(!collapsed || isMobile) && user?.subscription && (
        <div className="p-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-xs">
                {user ? `${user.firstName} ${user.lastName}` : 'Admin User'}
              </div>
              <div className="text-xs text-gray-400">{user?.subscription?.name || 'Free'} Plan</div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Active Jobs</span>
            <span className="font-medium text-gray-900">
              {user.usageCounts.activeJobs}/
              {user.subscription.maxJobs === -1 ? '∞' : user.subscription.maxJobs}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Interviews</span>
            <span className="font-medium text-gray-900">
              {user.usageCounts.interviewsThisMonth}/
              {user.subscription.maxInterviewsPerMonth === -1
                ? '∞'
                : user.subscription.maxInterviewsPerMonth}
            </span>
          </div>
        </div>
      )}

      {/* Subscribe Button for Unsubscribed Users */}
      {(!collapsed || isMobile) && !hasActiveSubscription && (
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={openSubscriptionModal}
            className="w-full px-4 py-2 bg-primary text-white rounded font-semibold hover:bg-primary/90 transition-all text-xs flex items-center justify-center gap-2"
          >
            <SparklesIcon className="w-4 h-4" />
            Subscribe
          </button>
        </div>
      )}

      {/* Billing Button */}
      {(!collapsed || isMobile) && hasActiveSubscription && (
        <div className="p-3 border-t border-gray-100">
          <BillingButton variant="outline" size="sm" className="w-full text-xs">
            Manage Billing
          </BillingButton>
        </div>
      )}

      {/* Collapsed Mode Tooltip/Expand Button */}
      {collapsed && !isMobile && (
        <div className="p-2 mt-auto">
          <button
            onClick={onToggleCollapse}
            className="w-full p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRightIcon className="w-5 h-5 mx-auto" />
          </button>
        </div>
      )}
    </div>
  );
}
