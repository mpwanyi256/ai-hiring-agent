import { JobData } from "@/lib/services/jobsService";
import { InterviewState } from "@/types/interview";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchInterview } from "./interviewThunks";

const initialState: InterviewState = {
  job: null,
  isLoading: false,
  error: null,
}

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setJob: (state, action: PayloadAction<JobData>) => {
      state.job = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInterview.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchInterview.fulfilled, (state, action) => {
        state.job = action.payload
        state.isLoading = false
      })
      .addCase(fetchInterview.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch interview'
        state.isLoading = false
      })
  }
})

export const { setJob } = interviewSlice.actions

export default interviewSlice.reducer