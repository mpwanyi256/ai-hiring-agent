import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { BillingState, UsageMetrics } from '@/types/billing';

// Base selectors
export const selectBillingState = (state: RootState): BillingState => state.billing;

export const selectSubscription = createSelector(
  [selectBillingState],
  (billing) => billing.subscription,
);

export const selectSubscriptionPlans = createSelector(
  [selectBillingState],
  (billing) => billing.plans,
);

export const selectBillingLoading = createSelector(
  [selectBillingState],
  (billing) => billing.isLoading,
);

export const selectBillingError = createSelector([selectBillingState], (billing) => billing.error);

export const selectCustomerPortalUrl = createSelector(
  [selectBillingState],
  (billing) => billing.customerPortalUrl,
);

export const selectCheckoutSessionUrl = createSelector(
  [selectBillingState],
  (billing) => billing.checkoutSessionUrl,
);

// Computed selectors
export const selectHasActiveSubscription = createSelector([selectSubscription], (subscription) => {
  if (!subscription) return false;
  return ['active', 'trialing'].includes(subscription.status);
});

export const selectIsTrialing = createSelector([selectSubscription], (subscription) => {
  if (!subscription) return false;
  return subscription.status === 'trialing';
});

export const selectCurrentPlan = createSelector(
  [selectSubscription, selectSubscriptionPlans],
  (subscription, plans) => {
    if (!subscription) return null;
    // Use the joined subscription data if available, otherwise find by ID
    if (subscription.subscriptions) {
      return subscription.subscriptions;
    }
    return plans.find((plan) => plan.id === subscription.subscription_id) || null;
  },
);

export const selectTrialDaysRemaining = createSelector([selectSubscription], (subscription) => {
  if (!subscription || !subscription.trial_end) return 0;

  const trialEnd = new Date(subscription.trial_end);
  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
});

export const selectUsageMetrics = createSelector(
  [(state: RootState) => state.auth.user],
  (user): UsageMetrics => {
    if (!user || !user.subscription) {
      return {
        activeJobs: 0,
        interviewsThisMonth: 0,
        jobsLimit: 1,
        interviewsLimit: 5,
        jobsUsagePercentage: 0,
        interviewsUsagePercentage: 0,
      };
    }

    // Use the existing auth user subscription structure
    const jobsLimit = user.subscription.maxJobs === -1 ? 999 : user.subscription.maxJobs;
    const interviewsLimit =
      user.subscription.maxInterviewsPerMonth === -1
        ? 999
        : user.subscription.maxInterviewsPerMonth;

    return {
      activeJobs: user.usageCounts.activeJobs,
      interviewsThisMonth: user.usageCounts.interviewsThisMonth,
      jobsLimit,
      interviewsLimit,
      jobsUsagePercentage: (user.usageCounts.activeJobs / jobsLimit) * 100,
      interviewsUsagePercentage: (user.usageCounts.interviewsThisMonth / interviewsLimit) * 100,
    };
  },
);

export const selectIsNearLimit = createSelector([selectUsageMetrics], (metrics) => {
  return metrics.jobsUsagePercentage >= 80 || metrics.interviewsUsagePercentage >= 80;
});

export const selectIsAtLimit = createSelector([selectUsageMetrics], (metrics) => {
  return metrics.jobsUsagePercentage >= 100 || metrics.interviewsUsagePercentage >= 100;
});

export const selectRecommendedPlan = createSelector(
  [selectSubscriptionPlans, selectUsageMetrics],
  (plans, metrics) => {
    if (!plans.length) return null;

    // If user is at or near limit, recommend the next tier
    if (metrics.jobsUsagePercentage >= 80 || metrics.interviewsUsagePercentage >= 80) {
      const currentPlanIndex = plans.findIndex(
        (plan) =>
          plan.max_jobs === metrics.jobsLimit ||
          plan.max_interviews_per_month === metrics.interviewsLimit,
      );

      if (currentPlanIndex >= 0 && currentPlanIndex < plans.length - 1) {
        return plans[currentPlanIndex + 1];
      }
    }

    // Default to Professional plan if no specific recommendation
    return plans.find((plan) => plan.name.toLowerCase() === 'pro') || plans[1] || plans[0];
  },
);
