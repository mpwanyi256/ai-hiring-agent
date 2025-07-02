import { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';

// Basic selectors
export const selectJobs = (state: RootState) => state.jobs;
export const selectJobsList = (state: RootState) => state.jobs.jobs;
export const selectCurrentJob = (state: RootState) => state.jobs.currentJob;
export const selectJobsLoading = (state: RootState) => state.jobs.isLoading;
export const selectJobsError = (state: RootState) => state.jobs.error;
export const selectTotalJobs = (state: RootState) => state.jobs.totalJobs;

// Memoized selectors
export const selectActiveJobs = createSelector(
  [selectJobsList],
  (jobs) => jobs.filter(job => job.isActive)
);

export const selectInactiveJobs = createSelector(
  [selectJobsList],
  (jobs) => jobs.filter(job => !job.isActive)
);

export const selectJobsByFormat = createSelector(
  [selectJobsList],
  (jobs) => ({
    text: jobs.filter(job => job.interviewFormat === 'text'),
    video: jobs.filter(job => job.interviewFormat === 'video'),
  })
);

export const selectJobsWithCandidates = createSelector(
  [selectJobsList],
  (jobs) => jobs.filter(job => (job.candidateCount || 0) > 0)
);

export const selectJobsWithoutCandidates = createSelector(
  [selectJobsList],
  (jobs) => jobs.filter(job => (job.candidateCount || 0) === 0)
);

export const selectJobById = createSelector(
  [selectJobsList, (state: RootState, jobId: string) => jobId],
  (jobs, jobId) => jobs.find(job => job.id === jobId)
);

export const selectJobsStats = createSelector(
  [selectJobsList],
  (jobs) => {
    const active = jobs.filter(job => job.isActive);
    const inactive = jobs.filter(job => !job.isActive);
    const withCandidates = jobs.filter(job => (job.candidateCount || 0) > 0);
    const totalCandidates = jobs.reduce((sum, job) => sum + (job.candidateCount || 0), 0);

    return {
      total: jobs.length,
      active: active.length,
      inactive: inactive.length,
      withCandidates: withCandidates.length,
      totalCandidates,
      averageCandidatesPerJob: jobs.length > 0 ? Math.round(totalCandidates / jobs.length * 10) / 10 : 0,
    };
  }
);

export const selectRecentJobs = createSelector(
  [selectJobsList],
  (jobs) => {
    return [...jobs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }
);

export const selectMostPopularJobs = createSelector(
  [selectJobsList],
  (jobs) => {
    return [...jobs]
      .sort((a, b) => (b.candidateCount || 0) - (a.candidateCount || 0))
      .slice(0, 5);
  }
);

// Job creation helpers
export const selectCanCreateMoreJobs = createSelector(
  [selectJobsList, (state: RootState) => state.auth.user],
  (jobs, user) => {
    if (!user || !user.subscription) return false;
    
    const activeJobs = jobs.filter(job => job.isActive).length;
    return activeJobs < user.subscription.maxJobs;
  }
);

export const selectJobCreationLimits = createSelector(
  [selectJobsList, (state: RootState) => state.auth.user],
  (jobs, user) => {
    if (!user || !user.subscription) return null;
    
    const activeJobs = jobs.filter(job => job.isActive).length;
    const maxJobs = user.subscription.maxJobs;
    
    return {
      used: activeJobs,
      limit: maxJobs,
      remaining: maxJobs - activeJobs,
      isAtLimit: activeJobs >= maxJobs,
      percentage: maxJobs > 0 ? Math.round((activeJobs / maxJobs) * 100) : 0,
    };
  }
); 