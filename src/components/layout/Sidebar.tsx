'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { 
  HomeIcon,
  BriefcaseIcon,
  ClockIcon,
  CreditCardIcon,
  CogIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  ClockIcon as ClockIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  CogIcon as CogIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserGroupIcon as UserGroupIconSolid
} from '@heroicons/react/24/solid';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      description: 'Overview and quick actions'
    },
    {
      name: 'Jobs',
      href: '/dashboard/jobs',
      icon: BriefcaseIcon,
      iconSolid: BriefcaseIconSolid,
      badge: user?.usageCounts.activeJobs || 0,
      description: 'Manage job postings'
    },
    {
      name: 'Candidates',
      href: '/dashboard/candidates',
      icon: UserGroupIcon,
      iconSolid: UserGroupIconSolid,
      badge: user?.usageCounts.interviewsThisMonth || 0,
      description: 'Review candidates'
    },
    {
      name: 'Reports',
      href: '/dashboard/reports',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      description: 'Analytics and insights'
    },
    {
      name: 'History',
      href: '/dashboard/history',
      icon: ClockIcon,
      iconSolid: ClockIconSolid,
      description: 'Past interviews and hiring'
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCardIcon,
      iconSolid: CreditCardIconSolid,
      description: 'Subscription and payments'
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: CogIcon,
      iconSolid: CogIconSolid,
      description: 'Account preferences'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-surface h-full">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-surface">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-primary font-bold text-lg">
              {user?.companyName?.charAt(0) || 'C'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-text text-sm">{user?.companyName}</h3>
            <p className="text-xs text-muted-text capitalize">
              {user?.subscription?.name || 'Free'} Plan
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const active = isActive(item.href);
          const Icon = active ? item.iconSolid : item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                ${active 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-muted-text hover:text-text hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`
                  w-5 h-5 transition-colors duration-200
                  ${active ? 'text-white' : 'text-muted-text group-hover:text-text'}
                `} />
                <div>
                  <span>{item.name}</span>
                  {item.description && (
                    <p className={`
                      text-xs mt-0.5 transition-colors duration-200
                      ${active ? 'text-white/80' : 'text-muted-text/70 group-hover:text-muted-text'}
                    `}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Badge */}
              {item.badge !== undefined && Number(item.badge) > 0 && (
                <span className={`
                  inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full
                  ${active 
                    ? 'bg-white/20 text-white' 
                    : 'bg-primary/10 text-primary'
                  }
                `}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Section (for free tier users) */}
      {user?.subscription?.name === 'free' && (
        <div className="p-4 border-t border-surface">
          <div className="bg-gradient-to-r from-primary/10 to-accent-blue/10 rounded-lg p-4">
            <h4 className="font-medium text-text text-sm mb-2">Upgrade to Pro</h4>
            <p className="text-xs text-muted-text mb-3">
              Unlock unlimited jobs and advanced features
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center w-full px-3 py-2 text-xs font-medium text-primary bg-white border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 