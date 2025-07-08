import { createAsyncThunk } from '@reduxjs/toolkit';
import { CreateCandidateData, SubmitInterviewData } from '@/types';
import { apiUtils } from '../api';
import { RootState } from '../index';

// Async thunks for candidates using API routes
export const fetchCandidatesByJob = createAsyncThunk(
  'candidates/fetchCandidatesByJob',
  async (jobId: string) => {
    try {
      const response = await apiUtils.get(`/api/candidates?jobId=${jobId}`);
      return response.candidates;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch candidates');
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

      const response = await apiUtils.get(`/api/jobs/${jobId}/candidates?${queryParams}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch job candidates');
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
      const response = await apiUtils.get(`/api/candidates/${candidateId}?profileId=${user.id}`);
      return response.candidate;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch candidate');
    }
  },
);

export const fetchCandidateByToken = createAsyncThunk(
  'candidates/fetchCandidateByToken',
  async (token: string) => {
    try {
      const response = await apiUtils.get(`/api/candidates/token/${token}`);
      return response.candidate;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch candidate');
    }
  },
);

// New thunk for fetching candidate resume with access control
export const fetchCandidateResume = createAsyncThunk(
  'candidates/fetchCandidateResume',
  async (candidateId: string) => {
    try {
      const response = await apiUtils.get(`/api/candidates/${candidateId}/resume`);
      return response.resume;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch candidate resume');
    }
  },
);

// New thunk for fetching AI evaluation with team assessments
export const fetchAIEvaluation = createAsyncThunk(
  'candidates/fetchAIEvaluation',
  async (candidateId: string) => {
    try {
      const response = await apiUtils.get(`/api/candidates/${candidateId}/ai-evaluation`);
      return {
        candidateId,
        aiEvaluation: response.aiEvaluation,
        teamAssessments: response.teamAssessments,
        computedValues: response.computedValues,
        candidateInfo: response.candidateInfo,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch AI evaluation');
    }
  },
);

// New thunk for triggering AI evaluation
export const triggerAIEvaluation = createAsyncThunk(
  'candidates/triggerAIEvaluation',
  async (params: { candidateId: string; force?: boolean }) => {
    try {
      const { candidateId, force = false } = params;
      const response = await apiUtils.post(`/api/candidates/${candidateId}/evaluate`, { force });
      return {
        candidateId,
        evaluation: response.evaluation,
        processingDurationMs: response.processingDurationMs,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to trigger AI evaluation');
    }
  },
);

export const createCandidate = createAsyncThunk(
  'candidates/createCandidate',
  async (candidateData: CreateCandidateData) => {
    try {
      const response = await apiUtils.post('/api/candidates', candidateData);
      return response.candidate;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create candidate');
    }
  },
);

export const submitInterview = createAsyncThunk(
  'candidates/submitInterview',
  async (submissionData: SubmitInterviewData) => {
    try {
      const response = await apiUtils.post(`/api/candidates/${submissionData.candidateId}/submit`, {
        responses: submissionData.responses,
      });
      return response.candidate;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to submit interview');
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
      const response = await apiUtils.post(
        `/api/candidates/${evaluationData.candidateId}/evaluation`,
        evaluationData,
      );
      return response.evaluation;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to save evaluation');
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
      const response = await apiUtils.put(
        `/api/evaluations/${evaluationData.evaluationId}`,
        evaluationData,
      );
      return response.evaluation;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update evaluation');
    }
  },
);

export const deleteCandidate = createAsyncThunk(
  'candidates/deleteCandidate',
  async (candidateId: string) => {
    try {
      await apiUtils.delete(`/api/candidates/${candidateId}`);
      return candidateId;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete candidate');
    }
  },
);

// AI Evaluation thunk
export const generateAIEvaluation = createAsyncThunk(
  'candidates/generateAIEvaluation',
  async (data: { candidateId: string; jobTitle: string; jobRequirements: any }) => {
    try {
      const response = await apiUtils.post('/api/ai/evaluate-candidate', data);
      return response.evaluation;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate AI evaluation');
    }
  },
);

// New thunk for fetching candidate responses
export const fetchCandidateResponses = createAsyncThunk(
  'candidates/fetchCandidateResponses',
  async (params: { candidateId: string; jobId: string }) => {
    try {
      const { candidateId, jobId } = params;
      const response = await apiUtils.get(
        `/api/candidates/${candidateId}/responses?jobId=${jobId}`,
      );
      return {
        candidateId,
        responses: response.responses || [],
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch candidate responses');
    }
  },
);
