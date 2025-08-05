'use client';

import { useAppSelector } from '@/store';
import {
  selectTrialDaysRemaining,
  selectIsTrialing,
  selectSubscription,
} from '@/store/billing/billingSelectors';
import { SubscriptionPlan } from '@/types/billing';
import { SparklesIcon, CheckIcon } from '@heroicons/react/24/outline';
import UpgradeButton from './UpgradeButton';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  billingPeriod: 'monthly' | 'yearly';
  isRecommended?: boolean;
  isCurrentPlan?: boolean;
}

export default function SubscriptionCard({
  plan,
  billingPeriod,
  isRecommended = false,
  isCurrentPlan = false,
}: SubscriptionCardProps) {
  const trialDaysRemaining = useAppSelector(selectTrialDaysRemaining);
  const isTrialing = useAppSelector(selectIsTrialing);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const subscription = useAppSelector(selectSubscription);

  const getPriceDisplay = () => {
    if (plan.name.toLowerCase() === 'enterprise') {
      return 'Custom';
    }

    const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
    if (price === 0) return 'Free';

    const interval = billingPeriod === 'monthly' ? 'month' : 'year';
    const formattedPrice = price.toLocaleString(undefined, { minimumFractionDigits: 0 });
    return `$${formattedPrice}/${interval}`;
  };

  const getButtonText = () => {
    if (isCurrentPlan) return 'Current Plan';
    if (plan.price_monthly === 0) return 'Get Started';

    // Check if user has an active subscription to determine upgrade/downgrade
    const currentPlan = subscription?.subscriptions;
    if (currentPlan && plan.price_monthly > currentPlan.price_monthly) {
      return 'Upgrade';
    } else if (currentPlan && plan.price_monthly < currentPlan.price_monthly) {
      return 'Downgrade';
    }

    // Show trial text for new subscriptions with trial periods
    if (plan.trial_days > 0 && !subscription) {
      return 'Start Free Trial';
    }

    return 'Subscribe';
  };

  return (
    <div
      className={`relative rounded-xl border p-6 transition-all duration-200 hover:shadow-lg ${
        isRecommended
          ? 'border-primary bg-primary/5 shadow-lg'
          : isCurrentPlan
            ? 'border-green-200 bg-green-50'
            : 'border-gray-200 bg-white hover:border-primary/20'
      }`}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
            Recommended
          </div>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Current
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h3
          className={`text-xl font-bold mb-2 ${isRecommended ? 'text-primary' : 'text-gray-900'}`}
        >
          {plan.description}
        </h3>
        <div className="text-3xl font-bold mb-2">{getPriceDisplay()}</div>

        {/* Show trial period for paid plans */}
        {plan.trial_days > 0 && plan.price_monthly > 0 && (
          <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
            <SparklesIcon className="w-4 h-4 mr-1" />
            {plan.trial_days}-day free trial
          </div>
        )}

        {/* Show current trial status if user is trialing */}
        {isTrialing && trialDaysRemaining > 0 && (
          <div className="text-sm text-amber-600 font-medium">
            {trialDaysRemaining} days left in trial
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <div className="text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>Active Jobs</span>
            <span className="font-medium">
              {plan.max_jobs === -1 ? 'Unlimited' : plan.max_jobs}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Interviews/Month</span>
            <span className="font-medium">
              {plan.max_interviews_per_month === -1 ? 'Unlimited' : plan.max_interviews_per_month}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-2">
              <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribe/Upgrade Button - Only if authenticated */}
      {isAuthenticated ? (
        <UpgradeButton
          targetPlan={plan}
          billingPeriod={billingPeriod}
          variant={isCurrentPlan ? 'ghost' : isRecommended ? 'default' : 'outline'}
          size="lg"
          className="w-full"
        >
          <SparklesIcon className="w-4 h-4" />
          {getButtonText()}
        </UpgradeButton>
      ) : null}
    </div>
  );
}
