'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { createCheckoutSession } from '@/store/billing/billingThunks';
import {
  selectTrialDaysRemaining,
  selectIsTrialing,
  selectBillingLoading,
} from '@/store/billing/billingSelectors';
import { SubscriptionPlan } from '@/types/billing';
import Button from '@/components/ui/Button';
import { SparklesIcon, CheckIcon } from '@heroicons/react/24/outline';

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
  const dispatch = useAppDispatch();
  const trialDaysRemaining = useAppSelector(selectTrialDaysRemaining);
  const isTrialing = useAppSelector(selectIsTrialing);
  const isLoading = useAppSelector(selectBillingLoading);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const handleUpgrade = async () => {
    try {
      setIsRedirecting(true);

      const result = await dispatch(
        createCheckoutSession({
          planId: plan.name, // Use plan name instead of plan ID
          billingPeriod, // Pass the billing period
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
        }),
      ).unwrap();

      // Redirect immediately using the URL from the API response
      if (result && result.url) {
        console.log('Redirecting to checkout:', result.url);
        window.location.href = result.url;
      } else {
        console.error('No checkout URL received from API');
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    } finally {
      setIsRedirecting(false);
    }
  };

  const getPriceDisplay = () => {
    if (plan.name.toLowerCase() === 'enterprise') {
      return 'Custom';
    }

    const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
    if (price === 0) return 'Free';

    const interval = billingPeriod === 'monthly' ? 'month' : 'year';
    return `$${price}/${interval}`;
  };

  const getButtonText = () => {
    if (isCurrentPlan) return 'Current Plan';
    if (plan.price_monthly === 0) return 'Get Started';
    return 'Upgrade';
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'ghost';
    if (isRecommended) return 'primary';
    return 'outline';
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
        <Button
          variant={getButtonVariant()}
          size="lg"
          className="w-full"
          onClick={handleUpgrade}
          disabled={isCurrentPlan || isLoading || isRedirecting}
        >
          {isLoading || isRedirecting ? (
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <SparklesIcon className="w-4 h-4" />
          )}
          {getButtonText()}
        </Button>
      ) : null}
    </div>
  );
}
