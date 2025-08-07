import { JobData } from '@/lib/services/jobsService';
import { InterviewState } from '@/types/interview';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  checkInterviewConflicts,
  completeInterview,
  fetchInterview,
  fetchInterviewQuestions,
  getCandidateDetails,
  saveInterviewResponse,
} from './interviewThunks';
import { fetchCompanyBySlug } from '../company/companyThunks';
import { apiError } from '@/lib/notification';

const initialState: InterviewState = {
  interview: null,
  interviewQuestions: [],
  interviewQuestionResponses: [],
  savingResponse: false,
  interviewStep: 1,
  isLoading: false,
  isQuestionsLoading: false,
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
    clearInterviewData: () => {
      return initialState;
    },
    setCandidateIsCompleted: (state, action: PayloadAction<boolean>) => {
      if (state.candidate) {
        state.candidate.isCompleted = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(completeInterview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeInterview.fulfilled, (state) => {
        state.isLoading = false;
        if (state.candidate) {
          state.candidate.isCompleted = true;
        }
      })
      .addCase(completeInterview.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to complete interview';
        state.isLoading = false;
      })
      .addCase(saveInterviewResponse.pending, (state) => {
        state.savingResponse = true;
      })
      .addCase(saveInterviewResponse.fulfilled, (state, action) => {
        const foundResponse = state.interviewQuestionResponses.find(
          (response) => response.id === action.payload.id,
        );
        if (foundResponse) {
          foundResponse.answer = action.payload.answer;
          foundResponse.responseTime = action.payload.responseTime;
        } else {
          state.interviewQuestionResponses.push(action.payload);
        }
        state.savingResponse = false;
      })
      .addCase(saveInterviewResponse.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to save interview response';
        state.savingResponse = false;
      })
      .addCase(fetchInterviewQuestions.pending, (state) => {
        state.isQuestionsLoading = true;
      })
      .addCase(fetchInterviewQuestions.fulfilled, (state, action) => {
        state.interviewQuestions = action.payload;
        state.isQuestionsLoading = false;
      })
      .addCase(fetchInterviewQuestions.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch interview questions';
        state.isQuestionsLoading = false;
        state.interviewQuestions = [];
      })
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

export const {
  setInterview,
  setInterviewStep,
  resetInterviewConflicts,
  clearInterviewData,
  setCandidateIsCompleted,
} = interviewSlice.actions;

export default interviewSlice.reducer;
