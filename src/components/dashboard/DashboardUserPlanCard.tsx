import { SparklesIcon } from '@heroicons/react/24/outline';
import { useAppSelector } from '@/store';
import { selectHasActiveSubscription, selectUser } from '@/store/auth/authSelectors';
import Button from '../ui/Button';
import { useSubscriptionModal } from '../modals/SubscriptionModal';

export const DashboardUserPlanCard = () => {
  const user = useAppSelector(selectUser);
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);
  const { open: openSubscriptionModal } = useSubscriptionModal() || {};

  if (!user) return null;

  const usagePercentage = user.subscription
    ? (user.usageCounts.activeJobs / user.subscription.maxJobs) * 100
    : 0;
  const interviewUsagePercentage = user.subscription
    ? (user.usageCounts.interviewsThisMonth / user.subscription.maxInterviewsPerMonth) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Your Plan</h3>
            <p className="text-xs text-gray-500 capitalize">
              {hasActiveSubscription ? user.subscription?.name : 'No active plan'}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="text-xs" onClick={openSubscriptionModal}>
          {hasActiveSubscription ? 'Upgrade' : 'Subscribe'}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">Jobs</span>
          {hasActiveSubscription ? (
            <span className="font-medium text-gray-900">
              {user.usageCounts.activeJobs}/
              {user.subscription?.maxJobs === -1 ? '∞' : user.subscription?.maxJobs}
            </span>
          ) : (
            <span className="font-medium text-gray-900">0</span>
          )}
        </div>
        {hasActiveSubscription ? (
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        ) : (
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-gray-200 h-1.5 rounded-full transition-all" />
          </div>
        )}

        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">Interviews (Monthly)</span>
          {hasActiveSubscription ? (
            <span className="font-medium text-gray-900">
              {user.usageCounts.interviewsThisMonth}/
              {user.subscription?.maxInterviewsPerMonth === -1
                ? '∞'
                : user.subscription?.maxInterviewsPerMonth}
            </span>
          ) : (
            <span className="font-medium text-gray-900">0</span>
          )}
        </div>
        {hasActiveSubscription && (
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(interviewUsagePercentage, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
