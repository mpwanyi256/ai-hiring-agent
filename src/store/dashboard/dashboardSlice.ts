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
    clearDashboardData: (state) => {
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
  clearDashboardData,
} = dashboardSlice.actions;
export default dashboardSlice.reducer;
