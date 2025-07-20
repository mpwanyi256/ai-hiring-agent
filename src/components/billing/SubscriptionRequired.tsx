'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);
  const isLoading = useAppSelector(selectBillingLoading);
  const [isCheckingAfterSuccess, setIsCheckingAfterSuccess] = useState(false);
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);

  // Check if user just completed checkout
  const isSuccessFromCheckout = searchParams.get('success') === 'true';

  useEffect(() => {
    // If user just completed checkout, give webhook time to process
    if (isSuccessFromCheckout) {
      setIsCheckingAfterSuccess(true);
      // Wait 3 seconds for webhook to process, then check subscription
      const timer = setTimeout(() => {
        dispatch(fetchSubscription());
        setIsCheckingAfterSuccess(false);
        setHasCheckedSubscription(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Normal flow - check subscription immediately
      dispatch(fetchSubscription());
      setHasCheckedSubscription(true);
    }
  }, [dispatch, isSuccessFromCheckout]);

  // If no subscription and not loading, redirect to pricing
  useEffect(() => {
    // Only redirect if we've checked the subscription and confirmed there's no active subscription
    if (hasCheckedSubscription && !isCheckingAfterSuccess && !isLoading && !hasActiveSubscription) {
      console.log('No active subscription found, redirecting to pricing');
      router.push('/pricing');
    }
  }, [hasCheckedSubscription, isCheckingAfterSuccess, isLoading, hasActiveSubscription, router]);

  // If we have an active subscription, show the children
  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  // If we're still loading or checking after success, show a loading state
  if (isLoading || isCheckingAfterSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-text">
            {isSuccessFromCheckout ? 'Setting up your subscription...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show fallback if provided, otherwise show a brief message before redirect
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default subscription required message
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <LockClosedIcon className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Subscription Required</h1>

        <p className="text-gray-600 mb-8">
          You need an active subscription to access this feature. Choose a plan that fits your
          needs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <SparklesIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-600">Advanced AI evaluation and scoring</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">30-Day Trial</h3>
            <p className="text-sm text-gray-600">Try any plan risk-free</p>
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
  );
}
