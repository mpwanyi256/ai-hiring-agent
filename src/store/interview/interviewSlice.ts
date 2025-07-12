import { JobData } from '@/lib/services/jobsService';
import { InterviewState } from '@/types/interview';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchInterview, getCandidateDetails } from './interviewThunks';
import { fetchCompanyBySlug } from '../company/companyThunks';

const initialState: InterviewState = {
  interview: null,
  interviewStep: 1,
  isLoading: false,
  error: null,
  candidate: null,
  company: null,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setInterview: (state, action: PayloadAction<JobData>) => {
      state.interview = action.payload;
    },
    setInterviewStep: (state, action: PayloadAction<number>) => {
      state.interviewStep = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export const { setInterview, setInterviewStep } = interviewSlice.actions;

export default interviewSlice.reducer;
