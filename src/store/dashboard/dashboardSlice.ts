import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UpcomingInterview {
  interview_id: string;
  interview_date: string;
  interview_time: string;
  interview_status: string;
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_email: string;
  job_title: string;
  meet_link?: string;
}

export interface CandidatePipelineItem {
  status: string;
  count: number;
}

interface DashboardState {
  upcomingInterviews: UpcomingInterview[];
  isLoading: boolean;
  error: string | null;
  candidatePipeline: CandidatePipelineItem[];
  pipelineLoading: boolean;
  pipelineError: string | null;
}

const initialState: DashboardState = {
  upcomingInterviews: [],
  isLoading: false,
  error: null,
  candidatePipeline: [],
  pipelineLoading: false,
  pipelineError: null,
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
    setCandidatePipeline(state, action: PayloadAction<CandidatePipelineItem[]>) {
      state.candidatePipeline = action.payload;
    },
    setPipelineLoading(state, action: PayloadAction<boolean>) {
      state.pipelineLoading = action.payload;
    },
    setPipelineError(state, action: PayloadAction<string | null>) {
      state.pipelineError = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setUpcomingInterviews,
  setCandidatePipeline,
  setPipelineLoading,
  setPipelineError,
} = dashboardSlice.actions;
export default dashboardSlice.reducer;
