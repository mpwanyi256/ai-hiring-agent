import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import {
  CandidatesResponse,
  CandidateListResponse,
  ResumeResponse,
  AIEvaluationResponse,
  FetchCandidatesByJobIdPayload,
  InterviewingCandidate,
  SaveEvaluationResponse,
  CreateCandidatePayload,
  UpdateEvaluationResponse,
  GenerateAIEvaluationResponse,
  CandidateResponsesResponse,
  EvaluationResponse,
  TeamAssessmentResponse,
  ShortlistResponse,
  GetShortlistedCandidatesPayload,
  ShortlistedCandidatesResponse,
  CandidateWithEvaluation,
} from '@/types/candidates';
import { APIResponse } from '@/types';
import { RootState } from '..';

export const fetchShortlistedCandidates = createAsyncThunk<
  ShortlistedCandidatesResponse,
  GetShortlistedCandidatesPayload
>('candidates/fetchShortlistedCandidates', async (params) => {
  try {
    const { jobId, status, search, page, limit } = params;

    const queryParams = new URLSearchParams({
      ...(status && { status: status.join(',') }),
      ...(search && { search }),
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiUtils.get<ShortlistedCandidatesResponse>(
      `/api/jobs/${jobId}/shortlisted?${queryParams}`,
    );
    return response;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch shortlisted candidates',
    );
  }
});

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
export const fetchJobCandidates = createAsyncThunk<
  CandidateListResponse,
  FetchCandidatesByJobIdPayload
>('candidates/fetchJobCandidates', async (params, { getState }) => {
  try {
    const state = getState() as RootState;
    const job = state.jobs.currentJob;
    const profileId = state.auth.user?.id;

    if (!job) {
      throw new Error('No job found');
    }

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
      profileId: profileId || '',
    });

    const response = await apiUtils.get<CandidateListResponse>(
      `/api/jobs/${jobId}/candidates?${queryParams}`,
    );
    return response;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch job candidates');
  }
});

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
export const fetchAIEvaluation = createAsyncThunk<AIEvaluationResponse, string>(
  'candidates/fetchAIEvaluation',
  async (candidateId) => {
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

export const createCandidate = createAsyncThunk<InterviewingCandidate, CreateCandidatePayload>(
  'candidates/createCandidate',
  async (candidateData) => {
    try {
      const response = await apiUtils.post<APIResponse<InterviewingCandidate>>(
        '/api/candidates',
        candidateData,
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create candidate');
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
  async ({ candidateId }: { candidateId: string }, { getState }) => {
    try {
      const selectedCandidate = (getState() as RootState).selectedCandidate.candidate;
      if (!selectedCandidate) {
        throw new Error('No candidate selected');
      }

      const response = await apiUtils.get<CandidateResponsesResponse>(
        `/api/candidates/${candidateId}/responses?jobId=${selectedCandidate.jobId}`,
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

export const updateCandidateStatus = createAsyncThunk(
  'candidates/updateCandidateStatus',
  async ({ candidateId, status }: { candidateId: string; status: string }) => {
    const response = await apiUtils.patch<APIResponse<CandidateWithEvaluation>>(
      `/api/candidates/${candidateId}/status`,
      { status },
    );
    return response.data;
  },
);
