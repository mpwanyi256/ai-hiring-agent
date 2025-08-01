import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UpcomingInterview {
  interview_id: string;
  candidate_id?: string;
  interview_date: string;
  interview_time: string;
  interview_status: string;
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_email: string;
  job_title: string;
  meet_link?: string;
  event_summary?: string;
  job_id: string;
}

export interface CandidatePipelineItem {
  status: string;
  count: number;
}

export interface RecentActivityItem {
  id: string;
  event_type: string;
  entity_id: string | null;
  entity_type: string | null;
  message: string;
  meta: Record<string, string | number | boolean>;
  created_at: string;
}

export interface DashboardMetrics {
  candidates: {
    total: number;
    thisWeek: number;
    trend: {
      value: number;
      isPositive: boolean;
      label: string;
    };
  };
  responseTime: {
    averageHours: number;
    formattedTime: string;
    trend: {
      value: number;
      isPositive: boolean;
      label: string;
    };
  };
}

interface DashboardState {
  upcomingInterviews: UpcomingInterview[];
  isLoading: boolean;
  error: string | null;
  candidatePipeline: CandidatePipelineItem[];
  pipelineLoading: boolean;
  pipelineError: string | null;
  recentActivity: RecentActivityItem[];
  recentActivityLoading: boolean;
  recentActivityError: string | null;
  totalUpcomingInterviews: number;
  metrics: DashboardMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
}

const initialState: DashboardState = {
  upcomingInterviews: [],
  isLoading: false,
  error: null,
  candidatePipeline: [],
  pipelineLoading: false,
  pipelineError: null,
  recentActivity: [],
  recentActivityLoading: false,
  recentActivityError: null,
  totalUpcomingInterviews: 0,
  metrics: null,
  metricsLoading: false,
  metricsError: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setUpcomingInterviews(state, action: PayloadAction<UpcomingInterview[]>) {
      state.upcomingInterviews = action.payload;
    },
    setTotalUpcomingInterviews(state, action: PayloadAction<number>) {
      state.totalUpcomingInterviews = action.payload;
    },
    setCandidatePipeline(state, action: PayloadAction<CandidatePipelineItem[]>) {
      state.candidatePipeline = action.payload;
    },
    setPipelineLoading(state, action: PayloadAction<boolean>) {
      state.pipelineLoading = action.payload;
    },
    setPipelineError(state, action: PayloadAction<string | null>) {
      state.pipelineError = action.payload;
    },
    setRecentActivity(state, action: PayloadAction<RecentActivityItem[]>) {
      state.recentActivity = action.payload;
    },
    setRecentActivityLoading(state, action: PayloadAction<boolean>) {
      state.recentActivityLoading = action.payload;
    },
    setRecentActivityError(state, action: PayloadAction<string | null>) {
      state.recentActivityError = action.payload;
    },
    setDashboardMetrics(state, action: PayloadAction<DashboardMetrics>) {
      state.metrics = action.payload;
    },
    setMetricsLoading(state, action: PayloadAction<boolean>) {
      state.metricsLoading = action.payload;
    },
    setMetricsError(state, action: PayloadAction<string | null>) {
      state.metricsError = action.payload;
    },
    clearDashboardData: () => {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setError,
  setUpcomingInterviews,
  setTotalUpcomingInterviews,
  setCandidatePipeline,
  setPipelineLoading,
  setPipelineError,
  setRecentActivity,
  setRecentActivityLoading,
  setRecentActivityError,
  setDashboardMetrics,
  setMetricsLoading,
  setMetricsError,
  clearDashboardData,
} = dashboardSlice.actions;

// Selectors
export const selectDashboardMetrics = (state: { dashboard: DashboardState }) =>
  state.dashboard.metrics;
export const selectMetricsLoading = (state: { dashboard: DashboardState }) =>
  state.dashboard.metricsLoading;
export const selectMetricsError = (state: { dashboard: DashboardState }) =>
  state.dashboard.metricsError;

export default dashboardSlice.reducer;
