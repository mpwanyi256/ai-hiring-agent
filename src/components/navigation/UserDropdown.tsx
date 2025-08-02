import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { signOut } from '@/store/auth/authThunks';
import {
  SparklesIcon,
  CogIcon,
  UserIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { clearJobsData } from '@/store/jobs/jobsSlice';
import { clearCandidatesData } from '@/store/candidates/candidatesSlice';
import { clearEvaluationData } from '@/store/evaluation/evaluationSlice';
import { clearSkills } from '@/store/skills/skillsSlice';
import { clearTraits } from '@/store/traits/traitsSlice';
import { clearTemplates } from '@/store/jobTemplates/jobTemplatesSlice';
import { clearInterviewData } from '@/store/interview/interviewSlice';
import { clearInterviews } from '@/store/interviews/interviewsSlice';
import { clearCompanyData } from '@/store/company/companySlice';
import { clearDashboardData } from '@/store/dashboard/dashboardSlice';
import { clearBillingData } from '@/store/billing/billingSlice';

interface UserDropdownProps {
  className?: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ className = '' }) => {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    try {
      setShowDropdown(false);
      await dispatch(signOut()).unwrap();
      // Reset all slices
      dispatch(clearJobsData());
      dispatch(clearCandidatesData());
      dispatch(clearEvaluationData());
      dispatch(clearSkills());
      dispatch(clearTraits());
      dispatch(clearTemplates());
      dispatch(clearInterviewData());
      dispatch(clearInterviews());
      dispatch(clearCompanyData());
      dispatch(clearDashboardData());
      dispatch(clearBillingData());
      router.push('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <div className={`relative ${className}`} data-dropdown>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 sm:space-x-3 text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="font-medium text-text text-sm">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-muted-text text-xs truncate max-w-[120px]">{user?.companyName}</p>
          </div>
        </div>
        <ChevronDownIcon className="w-4 h-4 text-muted-text hidden sm:block" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-light z-50">
          <div className="p-4 border-b border-gray-light">
            <p className="font-medium text-text text-sm">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-muted-text text-xs">{user?.email}</p>
            <p className="text-muted-text text-xs">{user?.companyName}</p>
            <p className="text-muted-text text-xs capitalize mt-1">
              {user?.subscription?.name || 'Free'} Plan
            </p>
          </div>

          <div className="py-2">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-2 text-sm text-text hover:bg-gray-50"
              onClick={() => setShowDropdown(false)}
            >
              <SparklesIcon className="w-4 h-4 mr-3 text-muted-text" />
              Dashboard
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center px-4 py-2 text-sm text-text hover:bg-gray-50"
              onClick={() => setShowDropdown(false)}
            >
              <CogIcon className="w-4 h-4 mr-3 text-muted-text" />
              Settings
            </Link>

            <div className="border-t border-gray-light my-1"></div>

            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-accent-red hover:bg-gray-50"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
