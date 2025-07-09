import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ResumeEvaluation, InterviewEvaluation } from '@/types/interview';
import {
  evaluateResume,
  saveResumeEvaluation,
  getResumeEvaluation,
  evaluateInterview,
  saveInterviewEvaluation,
  getInterviewEvaluation,
  getEvaluationHistory,
  deleteEvaluation,
} from '@/store/evaluation/evaluationThunks';
import { apiError } from '@/lib/notification';

export interface EvaluationState {
  // Resume evaluation
  currentResumeEvaluation: ResumeEvaluation | null;
  resumeEvaluationLoading: boolean;
  resumeEvaluationError: string | null;
  resumeEvaluationErrorType?: string;

  // Interview evaluation
  currentInterviewEvaluation: InterviewEvaluation | null;
  interviewEvaluationLoading: boolean;
  interviewEvaluationError: string | null;

  // Evaluation history
  evaluationHistory: InterviewEvaluation[];
  historyLoading: boolean;
  historyError: string | null;

  // UI state
  isUploading: boolean;
  uploadProgress: number;
}

const initialState: EvaluationState = {
  currentResumeEvaluation: null,
  resumeEvaluationLoading: false,
  resumeEvaluationError: null,
  resumeEvaluationErrorType: undefined,

  currentInterviewEvaluation: null,
  interviewEvaluationLoading: false,
  interviewEvaluationError: null,

  evaluationHistory: [],
  historyLoading: false,
  historyError: null,

  isUploading: false,
  uploadProgress: 0,
};

const evaluationSlice = createSlice({
  name: 'evaluation',
  initialState,
  reducers: {
    // Clear errors
    clearResumeError: (state) => {
      state.resumeEvaluationError = null;
      state.resumeEvaluationErrorType = undefined;
    },
    clearInterviewError: (state) => {
      state.interviewEvaluationError = null;
    },
    clearHistoryError: (state) => {
      state.historyError = null;
    },
    clearAllErrors: (state) => {
      state.resumeEvaluationError = null;
      state.interviewEvaluationError = null;
      state.historyError = null;
    },

    // Set evaluations
    setCurrentResumeEvaluation: (state, action: PayloadAction<ResumeEvaluation | null>) => {
      state.currentResumeEvaluation = action.payload;
    },
    setCurrentInterviewEvaluation: (state, action: PayloadAction<InterviewEvaluation | null>) => {
      state.currentInterviewEvaluation = action.payload;
    },

    // Upload progress
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload;
    },

    // Clear data
    clearEvaluationData: (state) => {
      state.currentResumeEvaluation = null;
      state.currentInterviewEvaluation = null;
      state.evaluationHistory = [];
      state.resumeEvaluationError = null;
      state.interviewEvaluationError = null;
      state.historyError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Evaluate Resume
      .addCase(evaluateResume.pending, (state) => {
        state.resumeEvaluationLoading = true;
        state.resumeEvaluationError = null;
        state.isUploading = true;
      })
      .addCase(evaluateResume.fulfilled, (state, action) => {
        state.resumeEvaluationLoading = false;
        state.currentResumeEvaluation = action.payload;
        state.isUploading = false;
        state.uploadProgress = 100;
      })
      .addCase(evaluateResume.rejected, (state) => {
        state.resumeEvaluationLoading = false;
        state.isUploading = false;
        state.uploadProgress = 0;
        apiError('Resume evaluation failed. Please try again.');
      })

      // Save Resume Evaluation
      .addCase(saveResumeEvaluation.pending, (state) => {
        state.resumeEvaluationLoading = true;
        state.resumeEvaluationError = null;
      })
      .addCase(saveResumeEvaluation.fulfilled, (state, action) => {
        state.resumeEvaluationLoading = false;
        state.currentInterviewEvaluation = action.payload;
      })
      .addCase(saveResumeEvaluation.rejected, (state, action) => {
        state.resumeEvaluationLoading = false;
        state.resumeEvaluationError = action.error.message || 'Failed to save resume evaluation';
      })

      // Get Resume Evaluation
      .addCase(getResumeEvaluation.pending, (state) => {
        state.resumeEvaluationLoading = true;
        state.resumeEvaluationError = null;
      })
      .addCase(getResumeEvaluation.fulfilled, (state, action) => {
        state.resumeEvaluationLoading = false;
        state.currentInterviewEvaluation = action.payload;
      })
      .addCase(getResumeEvaluation.rejected, (state, action) => {
        state.resumeEvaluationLoading = false;
        state.resumeEvaluationError = action.error.message || 'Failed to get resume evaluation';
      })

      // Evaluate Interview
      .addCase(evaluateInterview.pending, (state) => {
        state.interviewEvaluationLoading = true;
        state.interviewEvaluationError = null;
      })
      .addCase(evaluateInterview.fulfilled, (state, action) => {
        state.interviewEvaluationLoading = false;
        state.currentInterviewEvaluation = action.payload;
      })
      .addCase(evaluateInterview.rejected, (state, action) => {
        state.interviewEvaluationLoading = false;
        state.interviewEvaluationError = action.error.message || 'Failed to evaluate interview';
      })

      // Save Interview Evaluation
      .addCase(saveInterviewEvaluation.pending, (state) => {
        state.interviewEvaluationLoading = true;
        state.interviewEvaluationError = null;
      })
      .addCase(saveInterviewEvaluation.fulfilled, (state, action) => {
        state.interviewEvaluationLoading = false;
        state.currentInterviewEvaluation = action.payload;
      })
      .addCase(saveInterviewEvaluation.rejected, (state, action) => {
        state.interviewEvaluationLoading = false;
        state.interviewEvaluationError =
          action.error.message || 'Failed to save interview evaluation';
      })

      // Get Interview Evaluation
      .addCase(getInterviewEvaluation.pending, (state) => {
        state.interviewEvaluationLoading = true;
        state.interviewEvaluationError = null;
      })
      .addCase(getInterviewEvaluation.fulfilled, (state, action) => {
        state.interviewEvaluationLoading = false;
        state.currentInterviewEvaluation = action.payload;
      })
      .addCase(getInterviewEvaluation.rejected, (state, action) => {
        state.interviewEvaluationLoading = false;
        state.interviewEvaluationError =
          action.error.message || 'Failed to get interview evaluation';
      })

      // Get Evaluation History
      .addCase(getEvaluationHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(getEvaluationHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.evaluationHistory = action.payload;
      })
      .addCase(getEvaluationHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.error.message || 'Failed to get evaluation history';
      })

      // Delete Evaluation
      .addCase(deleteEvaluation.fulfilled, (state, action) => {
        state.evaluationHistory = state.evaluationHistory.filter(
          (evaluation) => evaluation.id !== action.payload,
        );
        // Clear current evaluation if it was deleted
        if (
          state.currentInterviewEvaluation &&
          state.currentInterviewEvaluation.id === action.payload
        ) {
          state.currentInterviewEvaluation = null;
        }
      });
  },
});

export const {
  clearResumeError,
  clearInterviewError,
  clearHistoryError,
  clearAllErrors,
  setCurrentResumeEvaluation,
  setCurrentInterviewEvaluation,
  setUploadProgress,
  setUploading,
  clearEvaluationData,
} = evaluationSlice.actions;

export default evaluationSlice.reducer;
