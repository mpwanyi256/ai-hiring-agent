import { JobData } from "@/lib/services/jobsService";
import { InterviewState } from "@/types/interview";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchInterview, getCandidateDetails } from "./interviewThunks";

const initialState: InterviewState = {
  interview: null,
  interviewStep: 1,
  isLoading: false,
  error: null,
  candidate: null,
}

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setInterview: (state, action: PayloadAction<JobData>) => {
      state.interview = action.payload
    },
    setInterviewStep: (state, action: PayloadAction<number>) => {
      state.interviewStep = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCandidateDetails.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getCandidateDetails.fulfilled, (state, { payload }) => {
        state.candidate = payload
        if (payload.currentStep > state.interviewStep) {
          state.interviewStep = payload.currentStep;
        }
        state.isLoading = false
      })
      .addCase(getCandidateDetails.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch candidate details'
        state.isLoading = false
      })
      .addCase(fetchInterview.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchInterview.fulfilled, (state, action) => {
        state.interview = action.payload
        state.isLoading = false
      })
      .addCase(fetchInterview.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch interview'
        state.isLoading = false
      })
  }
})

export const { setInterview, setInterviewStep } = interviewSlice.actions

export default interviewSlice.reducer