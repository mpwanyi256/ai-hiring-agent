import { createAsyncThunk } from '@reduxjs/toolkit';
import { CreateCandidateData, SubmitInterviewData } from '@/types';
import { apiUtils } from '../api';

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
  }
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
  }) => {
    try {
      const { jobId, search, status, page = 1, limit = 50 } = params;
      const queryParams = new URLSearchParams({
        ...(search && { search }),
        ...(status && { status }),
        page: page.toString(),
        limit: limit.toString(),
      });
      
      const response = await apiUtils.get(`/api/jobs/${jobId}/candidates?${queryParams}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch job candidates');
    }
  }
);

export const fetchCandidateById = createAsyncThunk(
  'candidates/fetchCandidateById',
  async (candidateId: string) => {
    try {
      const response = await apiUtils.get(`/api/candidates/${candidateId}`);
      return response.candidate;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch candidate');
    }
  }
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
  }
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
  }
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
  }
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
      const response = await apiUtils.post(`/api/candidates/${evaluationData.candidateId}/evaluation`, evaluationData);
      return response.evaluation;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to save evaluation');
    }
  }
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
      const response = await apiUtils.put(`/api/evaluations/${evaluationData.evaluationId}`, evaluationData);
      return response.evaluation;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update evaluation');
    }
  }
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
  }
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
  }
); 