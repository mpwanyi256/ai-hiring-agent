import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Candidate, Response } from '@/types';
import {
  fetchCandidatesByJob,
  fetchJobCandidates,
  fetchCandidateById,
  fetchCandidateByToken,
  createCandidate,
  submitInterview,
  saveEvaluation,
  updateEvaluation,
  deleteCandidate,
  generateAIEvaluation,
} from './candidatesThunks';

// Define the candidates state interface
interface CandidatesState {
  candidates: Candidate[];
  currentCandidate: Candidate | null;
  isLoading: boolean;
  error: string | null;
  totalCandidates: number;
  jobCandidatesStats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    averageScore: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

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
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentCandidate: (state, action: PayloadAction<Candidate | null>) => {
      state.currentCandidate = action.payload;
    },
    clearCurrentCandidate: (state) => {
      state.currentCandidate = null;
    },
    addResponse: (state, action: PayloadAction<Response>) => {
      if (state.currentCandidate) {
        if (!state.currentCandidate.responses) {
          state.currentCandidate.responses = [];
        }
        state.currentCandidate.responses.push(action.payload);
      }
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
      // Fetch Candidate by ID
      .addCase(fetchCandidateById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCandidateById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCandidate = action.payload;
      })
      .addCase(fetchCandidateById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch candidate';
      })
      // Fetch Candidate by Token
      .addCase(fetchCandidateByToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCandidateByToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCandidate = action.payload;
      })
      .addCase(fetchCandidateByToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch candidate';
      })
      // Create Candidate
      .addCase(createCandidate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCandidate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCandidate = action.payload;
        state.candidates.unshift(action.payload);
        state.totalCandidates += 1;
      })
      .addCase(createCandidate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create candidate';
      })
      // Submit Interview
      .addCase(submitInterview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitInterview.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentCandidate) {
          state.currentCandidate.submittedAt = action.payload.submittedAt;
        }
        // Update candidate in list
        const index = state.candidates.findIndex((c: Candidate) => c.id === action.payload.id);
        if (index !== -1) {
          state.candidates[index] = { ...state.candidates[index], ...action.payload };
        }
      })
      .addCase(submitInterview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to submit interview';
      })
      // Save Evaluation
      .addCase(saveEvaluation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveEvaluation.fulfilled, (state, action) => {
        state.isLoading = false;
        const candidateIndex = state.candidates.findIndex(
          (candidate: Candidate) => candidate.id === action.payload.candidateId
        );
        if (candidateIndex !== -1) {
          state.candidates[candidateIndex].evaluation = action.payload;
        }
        if (state.currentCandidate && state.currentCandidate.id === action.payload.candidateId) {
          state.currentCandidate.evaluation = action.payload;
        }
      })
      .addCase(saveEvaluation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to save evaluation';
      })
      // Update Evaluation
      .addCase(updateEvaluation.fulfilled, (state, action) => {
        const candidateIndex = state.candidates.findIndex(
          (candidate: Candidate) => candidate.id === action.payload.candidateId
        );
        if (candidateIndex !== -1) {
          state.candidates[candidateIndex].evaluation = action.payload;
        }
        if (state.currentCandidate && state.currentCandidate.id === action.payload.candidateId) {
          state.currentCandidate.evaluation = action.payload;
        }
      })
      // Delete Candidate
      .addCase(deleteCandidate.fulfilled, (state, action) => {
        state.candidates = state.candidates.filter((candidate: Candidate) => candidate.id !== action.payload);
        state.totalCandidates -= 1;
        if (state.currentCandidate && state.currentCandidate.id === action.payload) {
          state.currentCandidate = null;
        }
      })
      // Generate AI Evaluation
      .addCase(generateAIEvaluation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateAIEvaluation.fulfilled, (state, action) => {
        state.isLoading = false;
        const candidateIndex = state.candidates.findIndex(
          (candidate: Candidate) => candidate.id === action.payload.candidateId
        );
        if (candidateIndex !== -1) {
          state.candidates[candidateIndex].evaluation = action.payload;
        }
        if (state.currentCandidate && state.currentCandidate.id === action.payload.candidateId) {
          state.currentCandidate.evaluation = action.payload;
        }
      })
      .addCase(generateAIEvaluation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to generate AI evaluation';
      });
  },
});

export const { 
  clearError, 
  setCurrentCandidate, 
  clearCurrentCandidate, 
  addResponse,
  clearCandidatesData 
} = candidatesSlice.actions;

export default candidatesSlice.reducer; 