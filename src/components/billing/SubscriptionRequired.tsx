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
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);
  const isLoading = useAppSelector(selectBillingLoading);
  const [isCheckingAfterSuccess, setIsCheckingAfterSuccess] = useState(false);

  // Check if user just completed checkout
  // (keep the webhook delay logic if needed for other flows)

  useEffect(() => {
    dispatch(fetchSubscription());
  }, [dispatch]);

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
          <p className="text-muted-text">Loading...</p>
        </div>
      </div>
    );
  }

  // Otherwise, just render nothing (dashboard will handle the prompt)
  return null;
}
