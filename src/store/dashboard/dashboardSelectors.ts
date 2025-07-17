import { RootState } from '@/store';

export const selectUpcomingInterviews = (state: RootState) => state.dashboard.upcomingInterviews;
export const selectDashboardLoading = (state: RootState) => state.dashboard.isLoading;
export const selectDashboardError = (state: RootState) => state.dashboard.error;
export const selectTotalUpcomingInterviews = (state: RootState) =>
  state.dashboard.totalUpcomingInterviews;
export const selectCandidatePipeline = (state: RootState) => state.dashboard.candidatePipeline;
export const selectPipelineLoading = (state: RootState) => state.dashboard.pipelineLoading;
export const selectPipelineError = (state: RootState) => state.dashboard.pipelineError;
export const selectRecentActivity = (state: RootState) => state.dashboard.recentActivity;
export const selectRecentActivityLoading = (state: RootState) =>
  state.dashboard.recentActivityLoading;
export const selectRecentActivityError = (state: RootState) => state.dashboard.recentActivityError;
