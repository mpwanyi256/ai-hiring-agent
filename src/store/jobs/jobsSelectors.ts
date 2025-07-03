import { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';

// Basic selectors
export const selectJobs = (state: RootState) => state.jobs;
export const selectJobsList = (state: RootState) => state.jobs.jobs;
export const selectCurrentJob = (state: RootState) => state.jobs.currentJob;
export const selectJobsLoading = (state: RootState) => state.jobs.isLoading;
export const selectJobsError = (state: RootState) => state.jobs.error;
export const selectTotalJobs = (state: RootState) => state.jobs.totalJobs;
export const selectJobQuestions = (state: RootState) => state.jobs.currentJob?.questions || [];

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

// Job Status Selectors
export const selectJobsByStatus = createSelector(
  [selectJobsList],
  (jobs) => ({
    draft: jobs.filter(job => job.status === 'draft'),
    interviewing: jobs.filter(job => job.status === 'interviewing'), 
    closed: jobs.filter(job => job.status === 'closed'),
  })
);

export const selectJobStatusStats = createSelector(
  [selectJobsList],
  (jobs) => {
    const byStatus = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      draft: byStatus.draft || 0,
      interviewing: byStatus.interviewing || 0,
      closed: byStatus.closed || 0,
      total: jobs.length,
    };
  }
);

// Questions-related selectors
export const selectJobsWithQuestions = createSelector(
  [selectJobsList],
  (jobs) => jobs.filter(job => {
    // This would need to be enhanced with actual questions data
    // For now, assume jobs have questions if they're not in draft status
    return job.status !== 'draft';
  })
);

export const selectJobsNeedingQuestions = createSelector(
  [selectJobsList],
  (jobs) => jobs.filter(job => job.status === 'draft')
);

// Enhanced job analytics
export const selectJobAnalytics = createSelector(
  [selectJobsList],
  (jobs) => {
    const totalCandidates = jobs.reduce((sum, job) => sum + (job.candidateCount || 0), 0);
    const activeJobs = jobs.filter(job => job.isActive);
    const jobsWithCandidates = jobs.filter(job => (job.candidateCount || 0) > 0);
    
    // Jobs by format
    const formatStats = jobs.reduce((acc, job) => {
      acc[job.interviewFormat] = (acc[job.interviewFormat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Jobs by status
    const statusStats = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      inactiveJobs: jobs.length - activeJobs.length,
      totalCandidates,
      jobsWithCandidates: jobsWithCandidates.length,
      averageCandidatesPerJob: jobs.length > 0 ? Math.round((totalCandidates / jobs.length) * 10) / 10 : 0,
      formatDistribution: {
        text: formatStats.text || 0,
        video: formatStats.video || 0,
      },
      statusDistribution: {
        draft: statusStats.draft || 0,
        interviewing: statusStats.interviewing || 0,
        closed: statusStats.closed || 0,
      },
      conversionRate: activeJobs.length > 0 ? Math.round((jobsWithCandidates.length / activeJobs.length) * 100) : 0,
    };
  }
);

// Performance selectors
export const selectTopPerformingJobs = createSelector(
  [selectJobsList],
  (jobs) => {
    return [...jobs]
      .filter(job => (job.candidateCount || 0) > 0)
      .sort((a, b) => (b.candidateCount || 0) - (a.candidateCount || 0))
      .slice(0, 10);
  }
);

export const selectRecentlyUpdatedJobs = createSelector(
  [selectJobsList],
  (jobs) => {
    return [...jobs]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }
);

// Job status workflow selectors
export const selectJobsCanStartInterviewing = createSelector(
  [selectJobsList],
  (jobs) => jobs.filter(job => job.status === 'draft' && job.isActive)
);

export const selectJobsCanBeClosed = createSelector(
  [selectJobsList],
  (jobs) => jobs.filter(job => job.status === 'interviewing')
);

export const selectJobsCanBeReopened = createSelector(
  [selectJobsList],
  (jobs) => jobs.filter(job => job.status === 'closed' && job.isActive)
); 