import Link from 'next/link';
import { CalendarDaysIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useAppSelector } from '@/store';
import { selectHasActiveSubscription, selectUser } from '@/store/auth/authSelectors';
import { useSubscriptionModal } from '../modals/SubscriptionModal';

export const DashboardHeader = () => {
  const user = useAppSelector(selectUser);
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);
  const { open: openSubscriptionModal } = useSubscriptionModal() || {};

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Hi {user?.firstName}</h1>
          <p className="text-sm text-gray-600">
            Here&apos;s what&apos;s happening with your hiring today
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <CalendarDaysIcon className="w-4 h-4" />
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          {hasActiveSubscription ? (
            <Link href="/dashboard/jobs/new">
              <Button size="sm" className="text-xs">
                <PlusIcon className="w-4 h-4 mr-1" />
                New Job
              </Button>
            </Link>
          ) : (
            <Button size="sm" className="text-xs" onClick={openSubscriptionModal}>
              <SparklesIcon className="w-4 h-4 mr-1" />
              Upgrade to create jobs
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
