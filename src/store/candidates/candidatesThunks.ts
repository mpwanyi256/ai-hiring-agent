import { createAsyncThunk } from '@reduxjs/toolkit';
import { CreateCandidateData, SubmitInterviewData } from '@/types';
import { apiUtils } from '../api';
import { RootState } from '../index';

// Response type interfaces
interface CandidatesResponse {
  candidates: unknown[];
}

interface CandidateResponse {
  candidate: unknown;
}

interface CandidateListResponse {
  candidates: unknown[];
  total: number;
  page: number;
  limit: number;
}

interface AIEvaluationResponse {
  success: boolean;
  aiEvaluation: unknown;
  teamAssessments: unknown[];
  computedValues: unknown;
  candidateInfo: unknown;
}

interface ShortlistResponse {
  success: boolean;
  message: string;
}

interface ResumeResponse {
  resume: unknown;
}

interface EvaluationResponse {
  evaluations: unknown[];
}

interface CreateCandidateResponse {
  candidate: unknown;
}

interface SubmitInterviewResponse {
  candidate: unknown;
}

interface SaveEvaluationResponse {
  evaluation: unknown;
}

interface UpdateEvaluationResponse {
  evaluation: unknown;
}

interface GenerateAIEvaluationResponse {
  evaluation: unknown;
}

interface CandidateResponsesResponse {
  responses: unknown[];
}

interface TeamAssessmentResponse {
  assessment: unknown;
}

// Async thunks for candidates using API routes
export const fetchCandidatesByJob = createAsyncThunk(
  'candidates/fetchCandidatesByJob',
  async (jobId: string) => {
    try {
      const response = await apiUtils.get<CandidatesResponse>(`/api/jobs/${jobId}/candidates`);
      return response.candidates;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidates');
    }
  },
);

// New thunk for fetching job candidates with stats using the dedicated endpoint
export const fetchJobCandidates = createAsyncThunk(
  'candidates/fetchJobCandidates',
  async (params: {
    jobId: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    minScore?: number;
    maxScore?: number;
    startDate?: string;
    endDate?: string;
    candidateStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    try {
      const {
        jobId,
        search,
        status,
        page = 1,
        limit = 50,
        minScore,
        maxScore,
        startDate,
        endDate,
        candidateStatus,
        sortBy,
        sortOrder,
      } = params;

      const queryParams = new URLSearchParams({
        ...(search && { search }),
        ...(status && { status }),
        ...(minScore && { minScore: minScore.toString() }),
        ...(maxScore && { maxScore: maxScore.toString() }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(candidateStatus && { candidateStatus }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await apiUtils.get<CandidateListResponse>(
        `/api/jobs/${jobId}/candidates?${queryParams}`,
      );
      return response;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch job candidates');
    }
  },
);

export const fetchCandidateById = createAsyncThunk(
  'candidates/fetchCandidateById',
  async (candidateId: string, { getState }) => {
    try {
      const state = getState() as RootState;
      const user = state.auth.user;
      if (!user?.id) {
        throw new Error('User not found');
      }
      const response = await apiUtils.get<CandidateResponse>(
        `/api/candidates/${candidateId}?profileId=${user.id}`,
      );
      return response.candidate;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidate');
    }
  },
);

export const fetchCandidateByToken = createAsyncThunk(
  'candidates/fetchCandidateByToken',
  async (token: string) => {
    try {
      const response = await apiUtils.get<CandidateResponse>(`/api/candidates/token/${token}`);
      return response.candidate;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidate');
    }
  },
);

// New thunk for fetching candidate resume with access control
export const fetchCandidateResume = createAsyncThunk(
  'candidates/fetchCandidateResume',
  async (candidateId: string) => {
    try {
      const response = await apiUtils.get<ResumeResponse>(`/api/candidates/${candidateId}/resume`);
      return response.resume;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidate resume');
    }
  },
);

// New thunk for fetching AI evaluation with team assessments
export const fetchAIEvaluation = createAsyncThunk(
  'candidates/fetchAIEvaluation',
  async (candidateId: string) => {
    try {
      const response = await apiUtils.get<AIEvaluationResponse>(
        `/api/candidates/${candidateId}/ai-evaluation`,
      );
      return response;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch AI evaluation');
    }
  },
);

// New thunk for triggering AI evaluation
export const triggerAIEvaluation = createAsyncThunk(
  'candidates/triggerAIEvaluation',
  async (params: { candidateId: string; force?: boolean }) => {
    try {
      const { candidateId, force = false } = params;
      const response = await apiUtils.post<AIEvaluationResponse>(
        `/api/candidates/${candidateId}/ai-evaluation`,
        { force },
      );
      return response;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to trigger AI evaluation');
    }
  },
);

export const createCandidate = createAsyncThunk(
  'candidates/createCandidate',
  async (candidateData: Record<string, unknown>) => {
    try {
      const response = await apiUtils.post<CreateCandidateResponse>(
        '/api/candidates',
        candidateData,
      );
      return response.candidate;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create candidate');
    }
  },
);

export const submitInterview = createAsyncThunk(
  'candidates/submitInterview',
  async (submissionData: Record<string, unknown>) => {
    try {
      const response = await apiUtils.post<SubmitInterviewResponse>(
        `/api/candidates/${submissionData.candidateId}/submit`,
        {
          responses: submissionData.responses,
        },
      );
      return response.candidate;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to submit interview');
    }
  },
);

export const saveEvaluation = createAsyncThunk(
  'candidates/saveEvaluation',
  async (evaluationData: {
    candidateId: string;
    summary: string;
    score: number;
    strengths: string[];
    redFlags: string[];
  }) => {
    try {
      const response = await apiUtils.post<SaveEvaluationResponse>(
        `/api/candidates/${evaluationData.candidateId}/evaluation`,
        evaluationData,
      );
      return response.evaluation;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to save evaluation');
    }
  },
);

export const updateEvaluation = createAsyncThunk(
  'candidates/updateEvaluation',
  async (evaluationData: {
    evaluationId: string;
    candidateId: string;
    summary: string;
    score: number;
    strengths: string[];
    redFlags: string[];
  }) => {
    try {
      const response = await apiUtils.put<UpdateEvaluationResponse>(
        `/api/evaluations/${evaluationData.evaluationId}`,
        evaluationData,
      );
      return response.evaluation;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update evaluation');
    }
  },
);

export const deleteCandidate = createAsyncThunk(
  'candidates/deleteCandidate',
  async (candidateId: string) => {
    try {
      await apiUtils.delete(`/api/candidates/${candidateId}`);
      return candidateId;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete candidate');
    }
  },
);

// AI Evaluation thunk
export const generateAIEvaluation = createAsyncThunk(
  'candidates/generateAIEvaluation',
  async (data: {
    candidateId: string;
    jobTitle: string;
    jobRequirements: Record<string, unknown>;
  }) => {
    try {
      const response = await apiUtils.post<GenerateAIEvaluationResponse>(
        '/api/ai/evaluate-candidate',
        data,
      );
      return response.evaluation;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to generate AI evaluation');
    }
  },
);

// New thunk for fetching candidate responses
export const fetchCandidateResponses = createAsyncThunk(
  'candidates/fetchCandidateResponses',
  async (params: { candidateId: string; jobId: string }) => {
    try {
      const { candidateId, jobId } = params;
      const response = await apiUtils.get<CandidateResponsesResponse>(
        `/api/candidates/${candidateId}/responses?jobId=${jobId}`,
      );
      return {
        candidateId,
        responses: response.responses || [],
      };
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch candidate responses',
      );
    }
  },
);

export const fetchCandidateList = createAsyncThunk(
  'candidates/fetchCandidateList',
  async ({
    jobId,
    page = 1,
    limit = 10,
    status,
  }: {
    jobId: string;
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
      });
      const response = await apiUtils.get<CandidateListResponse>(
        `/api/jobs/${jobId}/candidates?${params}`,
      );
      return response;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidate list');
    }
  },
);

export const updateCandidateStatus = createAsyncThunk(
  'candidates/updateCandidateStatus',
  async ({ candidateId, status }: { candidateId: string; status: string }) => {
    try {
      const response = await apiUtils.put<CandidateResponse>(
        `/api/candidates/${candidateId}/status`,
        { status },
      );
      return response.candidate;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update candidate status');
    }
  },
);

export const fetchCandidateEvaluations = createAsyncThunk(
  'candidates/fetchCandidateEvaluations',
  async (candidateId: string) => {
    try {
      const response = await apiUtils.get<EvaluationResponse>(
        `/api/candidates/${candidateId}/evaluations`,
      );
      return response.evaluations;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch candidate evaluations',
      );
    }
  },
);

export const addTeamAssessment = createAsyncThunk(
  'candidates/addTeamAssessment',
  async ({
    candidateId,
    assessmentData,
  }: {
    candidateId: string;
    assessmentData: Record<string, unknown>;
  }) => {
    try {
      const response = await apiUtils.post<TeamAssessmentResponse>(
        `/api/candidates/${candidateId}/team-assessment`,
        assessmentData,
      );
      return response.assessment;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add team assessment');
    }
  },
);

export const shortlistCandidate = createAsyncThunk(
  'candidates/shortlistCandidate',
  async ({ candidateId, jobId }: { candidateId: string; jobId: string }) => {
    try {
      const response = await apiUtils.post<ShortlistResponse>(
        `/api/candidates/${candidateId}/shortlist`,
        { jobId },
      );
      return { candidateId, ...response };
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to shortlist candidate');
    }
  },
);

export const removeFromShortlist = createAsyncThunk(
  'candidates/removeFromShortlist',
  async ({ candidateId, jobId }: { candidateId: string; jobId: string }) => {
    try {
      await apiUtils.delete(`/api/candidates/${candidateId}/shortlist?jobId=${jobId}`);
      return candidateId;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove from shortlist');
    }
  },
);
