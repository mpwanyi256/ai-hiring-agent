import { User } from '@/types';
import { SubscriptionNames } from '@/types/billing';

/**
 * Check if user has access to AI model configuration features
 * Only Pro and Business plan users can configure custom AI models
 */
export function hasAIModelConfigAccess(user: User | null): boolean {
  if (!user?.subscription) {
    return false;
  }

  const subscriptionName = user.subscription?.name?.toLowerCase();

  return (
    subscriptionName === SubscriptionNames.PRO || subscriptionName === SubscriptionNames.BUSINESS
  );
}

/**
 * Check if user has an active subscription
 */
export function hasActiveSubscription(user: User | null): boolean {
  if (!user?.subscription) {
    return false;
  }

  return ['active', 'trialing'].includes(user.subscription.status);
}

/**
 * Get user's current plan name
 */
export function getCurrentPlanName(user: User | null): string {
  if (!user?.subscription?.name) {
    return 'No Plan';
  }

  return user.subscription.name;
}

/**
 * Check if user should use default OpenAI configuration
 * Returns true if user doesn't have Pro/Business access OR hasn't set up custom config
 */
export function shouldUseDefaultOpenAIConfig(user: User | null, hasCustomConfig: boolean): boolean {
  // If user doesn't have AI config access, always use default OpenAI
  if (!hasAIModelConfigAccess(user)) {
    return true;
  }

  // If user has access but hasn't set up custom config, use default OpenAI
  return !hasCustomConfig;
}
