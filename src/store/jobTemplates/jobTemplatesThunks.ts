import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import { JobTemplate } from '@/types/jobs';

// Fetch all job templates
export const fetchJobTemplates = createAsyncThunk(
  'jobTemplates/fetchJobTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiUtils.get<{ templates: JobTemplate[] }>('/api/job-templates');
      return response.templates;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch job templates');
    }
  }
);

// Create job template
export const createJobTemplate = createAsyncThunk(
  'jobTemplates/createJobTemplate',
  async (templateData: {
    name: string;
    title: string;
    fields: JobTemplate['fields'];
    interviewFormat: string;
  }, { rejectWithValue }) => {
    try {
      const response = await apiUtils.post<{ template: JobTemplate }>('/api/job-templates', templateData);
      return response.template;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create job template');
    }
  }
);

// Update job template
export const updateJobTemplate = createAsyncThunk(
  'jobTemplates/updateJobTemplate',
  async ({ id, ...updateData }: {
    id: string;
    name?: string;
    title?: string;
    fields?: JobTemplate['fields'];
    interviewFormat?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await apiUtils.put<{ template: JobTemplate }>(`/api/job-templates/${id}`, updateData);
      return response.template;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update job template');
    }
  }
);

// Delete job template
export const deleteJobTemplate = createAsyncThunk(
  'jobTemplates/deleteJobTemplate',
  async (templateId: string, { rejectWithValue }) => {
    try {
      await apiUtils.delete(`/api/job-templates/${templateId}`);
      return templateId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete job template');
    }
  }
); 