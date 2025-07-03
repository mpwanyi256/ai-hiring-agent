import { createAsyncThunk } from '@reduxjs/toolkit';
import { CreateJobData, UpdateJobData } from '@/types';
import { apiUtils } from '../api';
import { RootState } from '..';

// Async thunks for jobs using API routes
export const fetchJobsByProfile = createAsyncThunk(
  'jobs/fetchJobsByProfile',
  async (profileId: string) => {
    try {
      const response = await apiUtils.get(`/api/jobs?profileId=${profileId}`);
      return response.jobs;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch jobs');
    }
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId: string, { dispatch }) => {
    try {
      const response = await apiUtils.get(`/api/jobs/${jobId}`);
      const job = response.job;
      dispatch(fetchJobQuestions(jobId));
      return job;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch job');
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData: CreateJobData) => {
    try {
      const response = await apiUtils.post('/api/jobs', jobData);
      return response.job;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create job');
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async (jobData: UpdateJobData) => {
    try {
      const response = await apiUtils.put(`/api/jobs/${jobData.id}`, jobData);
      return response.job;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update job');
    }
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string) => {
    try {
      await apiUtils.delete(`/api/jobs/${jobId}`);
      return jobId;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete job');
    }
  }
);

export const toggleJobStatus = createAsyncThunk(
  'jobs/toggleJobStatus',
  async ({ jobId, isActive }: { jobId: string; isActive: boolean }) => {
    try {
      const response = await apiUtils.patch(`/api/jobs/${jobId}/status`, { isActive });
      return response.job;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to toggle job status');
    }
  }
);

// Thunks for job-related data
export const fetchSkills = createAsyncThunk(
  'jobs/fetchSkills',
  async () => {
    try {
      const response = await apiUtils.get('/api/skills');
      return response.skills;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch skills');
    }
  }
);

export const fetchTraits = createAsyncThunk(
  'jobs/fetchTraits',
  async () => {
    try {
      const response = await apiUtils.get('/api/traits');
      return response.traits;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch traits');
    }
  }
);

export const fetchJobTemplates = createAsyncThunk(
  'jobs/fetchJobTemplates',
  async (profileId: string) => {
    try {
      const response = await apiUtils.get(`/api/job-templates?profileId=${profileId}`);
      return response.templates;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch job templates');
    }
  }
);

export const saveJobTemplate = createAsyncThunk(
  'jobs/saveJobTemplate',
  async (templateData: {
    profileId: string;
    name: string;
    title: string;
    fields: any;
    interviewFormat: string;
  }) => {
    try {
      const response = await apiUtils.post('/api/job-templates', templateData);
      return response.template;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to save job template');
    }
  }
);

export const updateJobStatus = createAsyncThunk(
  'jobs/updateJobStatus',
  async ({ jobId, status }: { jobId: string; status: 'draft' | 'interviewing' | 'closed' }) => {
    try {
      const response = await apiUtils.put(`/api/jobs/${jobId}`, { status });
      return response.job;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update job status');
    }
  }
);

export const fetchJobQuestions = createAsyncThunk(
  'jobs/fetchJobQuestions',
  async (jobId: string) => {
    try {
      const response = await apiUtils.get(`/api/jobs/${jobId}/questions`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch job questions');
    }
  }
);

export const generateJobQuestions = createAsyncThunk(
  'jobs/generateJobQuestions',
  async ({ jobId, questionCount = 8, includeCustom = true, replaceExisting = false }: {
    jobId: string;
    questionCount?: number;
    includeCustom?: boolean;
    replaceExisting?: boolean;
  }) => {
    try {
      const response = await apiUtils.post(`/api/jobs/${jobId}/questions`, {
        questionCount,
        includeCustom,
        replaceExisting
      });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate questions');
    }
  }
);

export const deleteJobTemplate = createAsyncThunk(
  'jobs/deleteJobTemplate',
  async (templateId: string) => {
    try {
      await apiUtils.delete(`/api/job-templates/${templateId}`);
      return templateId;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete job template');
    }
  }
); 
