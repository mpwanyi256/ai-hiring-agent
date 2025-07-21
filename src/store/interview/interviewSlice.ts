import { JobData } from '@/lib/services/jobsService';
import { InterviewState } from '@/types/interview';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { checkInterviewConflicts, fetchInterview, getCandidateDetails } from './interviewThunks';
import { fetchCompanyBySlug } from '../company/companyThunks';
import { apiError } from '@/lib/notification';

const initialState: InterviewState = {
  interview: null,
  interviewStep: 1,
  isLoading: false,
  error: null,
  candidate: null,
  company: null,
  conflicts: [],
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setInterview: (state, action: PayloadAction<JobData | null>) => {
      state.interview = action.payload;
    },
    setInterviewStep: (state, action: PayloadAction<number>) => {
      state.interviewStep = action.payload;
    },
    resetInterviewConflicts: (state) => {
      state.conflicts = [];
    },
    clearInterviewData: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkInterviewConflicts.pending, (state) => {
        state.isLoading = true;
        state.conflicts = [];
      })
      .addCase(checkInterviewConflicts.fulfilled, (state, action) => {
        state.conflicts = action.payload;
        state.isLoading = false;
      })
      .addCase(checkInterviewConflicts.rejected, (state) => {
        apiError('Failed to check conflicts');
        state.isLoading = false;
      })
      .addCase(getCandidateDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCandidateDetails.fulfilled, (state, { payload }) => {
        state.candidate = payload;
        state.isLoading = false;

        if (state.interviewStep < 5 && payload.currentStep !== state.interviewStep) {
          // state.interviewStep = payload.currentStep;
        } else if (payload.isCompleted && state.interviewStep < 5) {
          state.interviewStep = 5;
        }
      })
      .addCase(getCandidateDetails.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch candidate details';
        state.isLoading = false;
      })
      .addCase(fetchInterview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchInterview.fulfilled, (state, action) => {
        state.interview = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchInterview.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch interview';
        state.isLoading = false;
      })
      .addCase(fetchCompanyBySlug.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCompanyBySlug.fulfilled, (state, action) => {
        state.company = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchCompanyBySlug.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch company';
        state.isLoading = false;
      });
  },
});

export const { setInterview, setInterviewStep, resetInterviewConflicts, clearInterviewData } =
  interviewSlice.actions;

export default interviewSlice.reducer;
