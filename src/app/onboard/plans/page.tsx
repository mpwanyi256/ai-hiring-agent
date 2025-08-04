'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import Container from '@/components/ui/Container';
import { fetchSubscriptionPlans } from '@/store/billing/billingThunks';
import { useAppDispatch } from '@/store';
import { RootState } from '@/store';
import { CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import UpgradeButton from '@/components/billing/UpgradeButton';

function PlansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const email = searchParams.get('email');

  const { plans } = useSelector((state: RootState) => state.billing);
  const { user } = useSelector((state: RootState) => state.auth);

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  const skipToFreePlan = () => {
    router.push('/dashboard?welcome=true');
  };

  const activePlans = plans.filter((plan) => plan.is_active && plan.name !== 'free');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getYearlySavings = (monthly: number, yearly: number) => {
    const yearlyTotal = monthly * 12;
    const savings = yearlyTotal - yearly;
    return Math.round((savings / yearlyTotal) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Container>
        <div className="py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">Choose Your Plan</h1>
            <p className="text-lg text-muted-text mb-6 max-w-2xl mx-auto">
              Start your hiring journey with a 14-day free trial. No credit card required. Upgrade
              or downgrade at any time.
            </p>
            {email && (
              <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-700 text-sm">
                  Account created successfully for {email}
                </span>
              </div>
            )}
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-surface rounded-lg p-1 flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-text shadow-sm'
                    : 'text-muted-text hover:text-text'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-text shadow-sm'
                    : 'text-muted-text hover:text-text'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  Save up to 20%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {activePlans.map((plan) => {
              const isPopular = plan.name === 'pro';
              const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
              const monthlyPrice = billingPeriod === 'yearly' ? price / 12 : price;
              const savings =
                billingPeriod === 'yearly'
                  ? getYearlySavings(plan.price_monthly, plan.price_yearly)
                  : 0;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl border-2 p-8 ${
                    isPopular
                      ? 'border-primary shadow-lg scale-105'
                      : 'border-gray-light hover:border-primary/50'
                  } transition-all duration-200`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-text capitalize mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-text">
                        {formatPrice(monthlyPrice)}
                      </span>
                      <span className="text-muted-text">/month</span>
                      {billingPeriod === 'yearly' && (
                        <div className="text-sm text-green-600 font-medium">
                          Save {savings}% annually
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-text">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    <div className="text-sm font-medium text-text mb-4">What&apos;s included:</div>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                          <span className="text-sm text-muted-text">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    {user ? (
                      <UpgradeButton
                        targetPlan={plan}
                        variant={isPopular ? 'default' : 'secondary'}
                        className="w-full"
                      >
                        Start 14-Day Free Trial
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </UpgradeButton>
                    ) : (
                      <Button
                        onClick={() =>
                          router.push(`/signin?redirect=${encodeURIComponent('/onboard/plans')}`)
                        }
                        className={`w-full ${isPopular ? 'bg-primary hover:bg-primary-dark' : ''}`}
                        variant={isPopular ? 'default' : 'secondary'}
                      >
                        Start 14-Day Free Trial
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    <div className="text-xs text-center text-muted-text">
                      No credit card required
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Free Option */}
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-surface rounded-lg mb-4">
              <span className="text-muted-text mr-2">Just exploring?</span>
              <button
                onClick={skipToFreePlan}
                className="text-primary hover:text-primary-light font-medium"
              >
                Continue with free access
              </button>
            </div>
            <p className="text-xs text-muted-text max-w-md mx-auto">
              You can always upgrade later. Free access includes 1 job posting and 5 interviews.
            </p>
          </div>

          {/* Security & Trust */}
          <div className="mt-16 text-center">
            <div className="flex justify-center items-center space-x-8 text-muted-text text-sm">
              <div className="flex items-center">
                <CheckIcon className="w-4 h-4 mr-2" />
                Cancel anytime
              </div>
              <div className="flex items-center">
                <CheckIcon className="w-4 h-4 mr-2" />
                Secure payments
              </div>
              <div className="flex items-center">
                <CheckIcon className="w-4 h-4 mr-2" />
                24/7 support
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlansPageContent />
    </Suspense>
  );
}
