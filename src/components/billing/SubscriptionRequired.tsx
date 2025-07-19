'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchSubscription } from '@/store/billing/billingThunks';
import {
  selectHasActiveSubscription,
  selectBillingLoading,
} from '@/store/billing/billingSelectors';
import Button from '@/components/ui/Button';
import { SparklesIcon, LockClosedIcon, CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SubscriptionRequiredProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function SubscriptionRequired({ children, fallback }: SubscriptionRequiredProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);
  const isLoading = useAppSelector(selectBillingLoading);

  useEffect(() => {
    // Only call fetchSubscription once - it already provides subscription status
    dispatch(fetchSubscription());
  }, [dispatch]);

  // If no subscription and not loading, redirect to pricing
  useEffect(() => {
    if (!isLoading && !hasActiveSubscription) {
      router.push('/pricing');
    }
  }, [isLoading, hasActiveSubscription, router]);

  // If we have an active subscription, show the children
  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  // If we're still loading, show a minimal loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-text">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback if provided, otherwise show a brief message before redirect
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <LockClosedIcon className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Subscription Required</h1>

          <p className="text-lg text-gray-600 mb-8">
            To access the full features of our AI hiring platform, you need to set up a subscription
            plan. All plans include a 30-day free trial with no credit card required.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">30-Day Free Trial</h3>
              <p className="text-sm text-gray-600">No credit card required to get started</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <SparklesIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Hiring</h3>
              <p className="text-sm text-gray-600">Advanced resume analysis and interviews</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cancel Anytime</h3>
              <p className="text-sm text-gray-600">No long-term commitments required</p>
            </div>
          </div>

          <div className="space-y-4">
            <Link href="/pricing">
              <Button size="lg" className="w-full md:w-auto">
                <SparklesIcon className="w-5 h-5 mr-2" />
                View Pricing Plans
              </Button>
            </Link>

            <div className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/dashboard/billing" className="text-primary hover:underline">
                Manage your subscription
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
