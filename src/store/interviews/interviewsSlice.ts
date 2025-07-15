import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  scheduleInterview,
  updateInterviewStatus,
} from './interviewsThunks';
import { InterviewsState, Interview } from '@/types/interviews';

const initialState: InterviewsState = {
  interviews: [],
  currentInterview: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  },
  scheduling: {
    isScheduling: false,
    schedulingApplicationId: null,
    isUpdating: false,
    updatingInterviewId: null,
  },
};

const interviewsSlice = createSlice({
  name: 'interviews',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentInterview: (state, action: PayloadAction<Interview | null>) => {
      state.currentInterview = action.payload;
    },
    clearCurrentInterview: (state) => {
      state.currentInterview = null;
    },
    setSchedulingApplication: (state, action: PayloadAction<string | null>) => {
      state.scheduling.schedulingApplicationId = action.payload;
    },
    setUpdatingInterview: (state, action: PayloadAction<string | null>) => {
      state.scheduling.updatingInterviewId = action.payload;
    },
    updateInterviewInList: (state, action: PayloadAction<Interview>) => {
      const index = state.interviews.findIndex((interview) => interview.id === action.payload.id);
      if (index !== -1) {
        state.interviews[index] = action.payload;
      }
    },
    removeInterviewFromList: (state, action: PayloadAction<string>) => {
      state.interviews = state.interviews.filter((interview) => interview.id !== action.payload);
    },
    clearInterviews: (state) => {
      state.interviews = [];
      state.currentInterview = null;
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Interviews
      .addCase(fetchInterviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInterviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.interviews = action.payload.interviews;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchInterviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch interviews';
      })
      // Create Interview
      .addCase(createInterview.pending, (state, action) => {
        state.scheduling.isScheduling = true;
        state.scheduling.schedulingApplicationId = action.meta.arg.applicationId;
        state.error = null;
      })
      .addCase(createInterview.fulfilled, (state, action) => {
        state.scheduling.isScheduling = false;
        state.scheduling.schedulingApplicationId = null;
        state.interviews.unshift(action.payload.interview);
        state.currentInterview = action.payload.interview;
      })
      .addCase(createInterview.rejected, (state, action) => {
        state.scheduling.isScheduling = false;
        state.scheduling.schedulingApplicationId = null;
        state.error = action.error.message || 'Failed to create interview';
      })
      // Update Interview
      .addCase(updateInterview.pending, (state, action) => {
        state.scheduling.isUpdating = true;
        state.scheduling.updatingInterviewId = action.meta.arg.id;
        state.error = null;
      })
      .addCase(updateInterview.fulfilled, (state, action) => {
        state.scheduling.isUpdating = false;
        state.scheduling.updatingInterviewId = null;
        const index = state.interviews.findIndex(
          (interview) => interview.id === action.payload.interview.id,
        );
        if (index !== -1) {
          state.interviews[index] = action.payload.interview;
        }
        if (state.currentInterview?.id === action.payload.interview.id) {
          state.currentInterview = action.payload.interview;
        }
      })
      .addCase(updateInterview.rejected, (state, action) => {
        state.scheduling.isUpdating = false;
        state.scheduling.updatingInterviewId = null;
        state.error = action.error.message || 'Failed to update interview';
      })
      // Delete Interview
      .addCase(deleteInterview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteInterview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.interviews = state.interviews.filter(
          (interview) => interview.id !== action.payload.interviewId,
        );
        if (state.currentInterview?.id === action.payload.interviewId) {
          state.currentInterview = null;
        }
      })
      .addCase(deleteInterview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete interview';
      })
      // Schedule Interview (alias for createInterview)
      .addCase(scheduleInterview.pending, (state, action) => {
        state.scheduling.isScheduling = true;
        state.scheduling.schedulingApplicationId = action.meta.arg.applicationId;
        state.error = null;
      })
      .addCase(scheduleInterview.fulfilled, (state, action) => {
        state.scheduling.isScheduling = false;
        state.scheduling.schedulingApplicationId = null;
        state.interviews.unshift(action.payload.interview);
        state.currentInterview = action.payload.interview;
      })
      .addCase(scheduleInterview.rejected, (state, action) => {
        state.scheduling.isScheduling = false;
        state.scheduling.schedulingApplicationId = null;
        state.error = action.error.message || 'Failed to schedule interview';
      })
      // Update Interview Status
      .addCase(updateInterviewStatus.pending, (state, action) => {
        state.scheduling.isUpdating = true;
        state.scheduling.updatingInterviewId = action.meta.arg.interviewId;
        state.error = null;
      })
      .addCase(updateInterviewStatus.fulfilled, (state, action) => {
        state.scheduling.isUpdating = false;
        state.scheduling.updatingInterviewId = null;
        const index = state.interviews.findIndex(
          (interview) => interview.id === action.payload.interview.id,
        );
        if (index !== -1) {
          state.interviews[index] = action.payload.interview;
        }
        if (state.currentInterview?.id === action.payload.interview.id) {
          state.currentInterview = action.payload.interview;
        }
      })
      .addCase(updateInterviewStatus.rejected, (state, action) => {
        state.scheduling.isUpdating = false;
        state.scheduling.updatingInterviewId = null;
        state.error = action.error.message || 'Failed to update interview status';
      });
  },
});

export const {
  clearError,
  setCurrentInterview,
  clearCurrentInterview,
  setSchedulingApplication,
  setUpdatingInterview,
  updateInterviewInList,
  removeInterviewFromList,
  clearInterviews,
} = interviewsSlice.actions;

export default interviewsSlice.reducer;
