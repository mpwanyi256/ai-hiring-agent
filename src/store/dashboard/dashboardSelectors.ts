import { RootState } from '@/store';

export const selectUpcomingInterviews = (state: RootState) => state.dashboard.upcomingInterviews;
export const selectDashboardLoading = (state: RootState) => state.dashboard.isLoading;
export const selectDashboardError = (state: RootState) => state.dashboard.error;
