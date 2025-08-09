import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import {
  selectHasActiveSubscription,
  selectIsAuthenticated,
  selectUser,
} from '@/store/auth/authSelectors';

interface UseSubscriptionGuardOptions {
  redirectTo?: string;
  allowTrialing?: boolean;
  bypassFor?: string[]; // User roles that can bypass the check
}

export function useSubscriptionGuard(options: UseSubscriptionGuardOptions = {}) {
  const router = useRouter();
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  const { redirectTo = '/pricing', allowTrialing = true, bypassFor = ['admin'] } = options;

  useEffect(() => {
    // Only check after authentication is confirmed
    if (!isAuthenticated || !user) {
      return;
    }

    // Check if user's role can bypass subscription check
    if (bypassFor.includes(user.role)) {
      return;
    }

    // Check subscription status
    const hasValidSubscription =
      hasActiveSubscription || (allowTrialing && user.subscription?.status === 'trialing');

    if (!hasValidSubscription) {
      console.log('🚫 Access denied: No active subscription, redirecting to:', redirectTo);
      router.push(redirectTo);
    }
  }, [hasActiveSubscription, isAuthenticated, user, router, redirectTo, allowTrialing, bypassFor]);

  return {
    hasActiveSubscription,
    isSubscriptionValid:
      hasActiveSubscription || (allowTrialing && user?.subscription?.status === 'trialing'),
    user,
  };
}
