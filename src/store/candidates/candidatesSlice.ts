import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Candidate, Response } from '@/types';
import { AIEvaluation, TeamAssessment } from '@/types/evaluations';
import {
  fetchCandidatesByJob,
  fetchJobCandidates,
  fetchCandidateById,
  fetchCandidateByToken,
  fetchCandidateResume,
  fetchAIEvaluation,
  triggerAIEvaluation,
  createCandidate,
  submitInterview,
  saveEvaluation,
  updateEvaluation,
  deleteCandidate,
  generateAIEvaluation,
  fetchCandidateResponses,
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
  // AI evaluation state
  aiEvaluation: {
    isEvaluating: boolean;
    evaluatingCandidateId: string | null;
    lastEvaluationDuration: number | null;
    isLoadingEvaluation: boolean;
    currentEvaluation: {
      candidateId: string | null;
      aiEvaluation: AIEvaluation | null;
      teamAssessments: TeamAssessment[];
      computedValues: any;
    } | null;
  };
  // Candidate responses state
  candidateResponses: {
    [candidateId: string]: {
      responses: any[];
      isLoading: boolean;
      error: string | null;
    };
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
      state.aiEvaluation = {
        isEvaluating: false,
        evaluatingCandidateId: null,
        lastEvaluationDuration: null,
        isLoadingEvaluation: false,
        currentEvaluation: null,
      };
    },
    updateCandidateRealtime(state, action) {
      // Update or add candidate in state.candidates
      const idx = state.candidates.findIndex(c => c.id === action.payload.id);
      if (idx !== -1) {
        state.candidates[idx] = { ...state.candidates[idx], ...action.payload };
      } else {
        state.candidates.push(action.payload);
      }
    },
    updateResponseRealtime(state, action) {
      // Find candidate and update responses
      const candidate = state.candidates.find(c => c.id === action.payload.candidate_id);
      if (candidate) {
        candidate.responses = candidate.responses || [];
        const idx = candidate.responses.findIndex(r => r.id === action.payload.id);
        if (idx !== -1) {
          candidate.responses[idx] = action.payload;
        } else {
          candidate.responses.push(action.payload);
        }
      }
    },
    updateEvaluationRealtime(state, action) {
      // Find candidate and update evaluation
      const candidate = state.candidates.find(c => c.id === action.payload.candidate_id);
      if (candidate) {
        candidate.evaluation = action.payload;
      }
    },
    updateAIEvaluationRealtime(state, action) {
      // Find candidate and update evaluation (ai_evaluations also update evaluation field)
      const candidate = state.candidates.find(c => c.id === action.payload.candidate_id);
      if (candidate) {
        candidate.evaluation = action.payload;
      }
    },
    updateResumeRealtime(state, action) {
      // Find candidate and update resume
      const candidate = state.candidates.find(c => c.id === action.payload.candidate_id);
      if (candidate) {
        candidate.resume = action.payload;
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
      // Fetch Candidate Resume
      .addCase(fetchCandidateResume.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchCandidateResume.fulfilled, (_state, _action) => {
        // Resume fetching is typically just for download, so we don't need to store it in state
        // The action payload contains the resume URL which is handled by the component
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
      .addCase(triggerAIEvaluation.fulfilled, (state, action) => {
        state.aiEvaluation.isEvaluating = false;
        state.aiEvaluation.evaluatingCandidateId = null;
        state.aiEvaluation.lastEvaluationDuration = action.payload.processingDurationMs;
        
        // Update candidate in the list with new evaluation
        const candidateIndex = state.candidates.findIndex(
          (candidate: Candidate) => candidate.id === action.payload.candidateId
        );
        if (candidateIndex !== -1) {
          // The evaluation will be fetched in the next refresh, so we can mark it as updated
          // In a real app, you might want to transform the AI evaluation to the candidate format
        }
        
        if (state.currentCandidate && state.currentCandidate.id === action.payload.candidateId) {
          // Mark that this candidate has been evaluated
        }
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
  setCurrentCandidate, 
  clearCurrentCandidate, 
  addResponse,
  clearCandidatesData,
  updateCandidateRealtime,
  updateResponseRealtime,
  updateEvaluationRealtime,
  updateAIEvaluationRealtime,
  updateResumeRealtime
} = candidatesSlice.actions;

export default candidatesSlice.reducer; 