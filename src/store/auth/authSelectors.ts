import { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';

// Basic selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectError = (state: RootState) => state.auth.error;
export const selectCompanySlug = (state: RootState) => state.auth.user?.companySlug;

// Memoized selectors
export const selectUserDetails = createSelector([selectUser], (user) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    role: user.role,
  };
});

export const selectCompanyDetails = createSelector([selectUser], (user) => {
  if (!user) return null;

  return {
    id: user.companyId,
    name: user.companyName,
    slug: user.companySlug,
  };
});

export const selectSubscriptionDetails = createSelector([selectUser], (user) => {
  if (!user || !user.subscription) return null;

  return {
    ...user.subscription,
    isActive: user.subscription.status === 'active',
    isFree: user.subscription.name === 'free',
    isPro: user.subscription.name === 'pro',
    isBusiness: user.subscription.name === 'business',
    isEnterprise: user.subscription.name === 'enterprise',
  };
});

export const selectUsageCounts = createSelector([selectUser], (user) => {
  if (!user) return null;

  return user.usageCounts;
});

export const selectUsageLimits = createSelector([selectUser], (user) => {
  if (!user || !user.subscription) return null;

  const { subscription, usageCounts } = user;

  return {
    jobs: {
      used: usageCounts.activeJobs,
      limit: subscription.maxJobs,
      remaining: subscription.maxJobs - usageCounts.activeJobs,
      isAtLimit: usageCounts.activeJobs >= subscription.maxJobs,
    },
    interviews: {
      used: usageCounts.interviewsThisMonth,
      limit: subscription.maxInterviewsPerMonth,
      remaining: subscription.maxInterviewsPerMonth - usageCounts.interviewsThisMonth,
      isAtLimit: usageCounts.interviewsThisMonth >= subscription.maxInterviewsPerMonth,
    },
  };
});

export const selectCanCreateJob = createSelector([selectUsageLimits], (limits) => {
  if (!limits) return false;
  return !limits.jobs.isAtLimit;
});

export const selectCanConductInterview = createSelector([selectUsageLimits], (limits) => {
  if (!limits) return false;
  return !limits.interviews.isAtLimit;
});
