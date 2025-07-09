import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Candidate, CandidatesState } from '@/types/candidates';
import {
  fetchCandidatesByJob,
  fetchJobCandidates,
  fetchCandidateResume,
  fetchAIEvaluation,
  triggerAIEvaluation,
  createCandidate,
  deleteCandidate,
  fetchCandidateResponses,
} from './candidatesThunks';

const initialState: CandidatesState = {
  candidates: [],
  currentCandidate: null,
  isLoading: false,
  error: null,
  totalCandidates: 0,
  // Add new fields for job candidates with stats
  jobCandidatesStats: {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    averageScore: 0,
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasMore: false,
  },
  // AI evaluation state
  aiEvaluation: {
    isEvaluating: false,
    evaluatingCandidateId: null,
    lastEvaluationDuration: null,
    isLoadingEvaluation: false,
    currentEvaluation: null,
  },
  // Candidate responses state
  candidateResponses: {},
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCandidate: (state) => {
      state.currentCandidate = null;
    },
    addResponse: () => {
      console.log('addResponse');
    },
    clearCandidatesData: (state) => {
      state.candidates = [];
      state.currentCandidate = null;
      state.totalCandidates = 0;
      state.error = null;
      state.jobCandidatesStats = {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        averageScore: 0,
      };
      state.pagination = {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasMore: false,
      };
      state.aiEvaluation = {
        isEvaluating: false,
        evaluatingCandidateId: null,
        lastEvaluationDuration: null,
        isLoadingEvaluation: false,
        currentEvaluation: null,
      };
    },
    updateCandidateRealtime(state, action: PayloadAction<Partial<Candidate>>) {
      // Update or add candidate in state.candidates
      const idx = state.candidates.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.candidates[idx] = { ...state.candidates[idx], ...action.payload };
      } else {
        state.candidates.push(action.payload as Candidate);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Candidates by Job
      .addCase(fetchCandidatesByJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCandidatesByJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.candidates = action.payload;
        state.totalCandidates = action.payload.length;
      })
      .addCase(fetchCandidatesByJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch candidates';
      })
      // Fetch Job Candidates (new endpoint with stats)
      .addCase(fetchJobCandidates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobCandidates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.candidates = action.payload.candidates;
        state.totalCandidates = action.payload.stats.total;
        state.jobCandidatesStats = action.payload.stats;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchJobCandidates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch job candidates';
      })
      // Fetch Candidate Resume
      .addCase(fetchCandidateResume.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchCandidateResume.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch candidate resume';
      })
      // Fetch AI Evaluation
      .addCase(fetchAIEvaluation.pending, (state) => {
        state.aiEvaluation.isLoadingEvaluation = true;
        state.error = null;
      })
      .addCase(fetchAIEvaluation.fulfilled, (state, action) => {
        state.aiEvaluation.isLoadingEvaluation = false;
        state.aiEvaluation.currentEvaluation = action.payload;
      })
      .addCase(fetchAIEvaluation.rejected, (state, action) => {
        state.aiEvaluation.isLoadingEvaluation = false;
        state.error = action.error.message || 'Failed to fetch AI evaluation';
      })
      // Trigger AI Evaluation
      .addCase(triggerAIEvaluation.pending, (state, action) => {
        state.aiEvaluation.isEvaluating = true;
        state.aiEvaluation.evaluatingCandidateId = action.meta.arg.candidateId;
        state.error = null;
      })
      .addCase(triggerAIEvaluation.rejected, (state, action) => {
        state.aiEvaluation.isEvaluating = false;
        state.aiEvaluation.evaluatingCandidateId = null;
        state.error = action.error.message || 'Failed to trigger AI evaluation';
      })
      // Create Candidate
      .addCase(createCandidate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCandidate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCandidate = action.payload;
        state.totalCandidates += 1;
      })
      .addCase(createCandidate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create candidate';
      })
      // Delete Candidate
      .addCase(deleteCandidate.fulfilled, (state, action) => {
        state.candidates = state.candidates.filter(
          (candidate: Candidate) => candidate.id !== action.payload,
        );
        state.totalCandidates -= 1;
        if (state.currentCandidate && state.currentCandidate.id === action.payload) {
          state.currentCandidate = null;
        }
      })
      // Fetch Candidate Responses
      .addCase(fetchCandidateResponses.pending, (state, action) => {
        const candidateId = action.meta.arg.candidateId;
        state.candidateResponses[candidateId] = {
          responses: [],
          isLoading: true,
          error: null,
        };
      })
      .addCase(fetchCandidateResponses.fulfilled, (state, action) => {
        const candidateId = action.payload.candidateId;
        state.candidateResponses[candidateId] = {
          responses: action.payload.responses,
          isLoading: false,
          error: null,
        };
      })
      .addCase(fetchCandidateResponses.rejected, (state, action) => {
        const candidateId = action.meta.arg.candidateId;
        state.candidateResponses[candidateId] = {
          responses: [],
          error: action.error.message || 'Failed to fetch candidate responses',
          isLoading: false,
        };
      });
  },
});

export const {
  clearError,
  clearCurrentCandidate,
  addResponse,
  clearCandidatesData,
  updateCandidateRealtime,
} = candidatesSlice.actions;

export default candidatesSlice.reducer;
