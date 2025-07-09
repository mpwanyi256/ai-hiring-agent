import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import { JobTemplate } from '@/types/jobs';

interface CreateTemplateResponse {
  template: JobTemplate;
}

interface UpdateTemplateResponse {
  template: JobTemplate;
}

// Fetch all job templates
export const fetchJobTemplates = createAsyncThunk<JobTemplate[], string>(
  'jobTemplates/fetchJobTemplates',
  async (profileId) => {
    try {
      const response = await apiUtils.get<{ templates: JobTemplate[] }>(
        `/api/job-templates?profileId=${profileId}`,
      );
      return response.templates;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch job templates');
    }
  },
);

// Create job template
export const createJobTemplate = createAsyncThunk(
  'jobTemplates/createJobTemplate',
  async (templateData: Record<string, unknown>) => {
    try {
      const response = await apiUtils.post<CreateTemplateResponse>(
        '/api/job-templates',
        templateData,
      );
      return response.template;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create job template');
    }
  },
);

// Update job template
export const updateJobTemplate = createAsyncThunk(
  'jobTemplates/updateJobTemplate',
  async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
    try {
      const response = await apiUtils.put<UpdateTemplateResponse>(`/api/job-templates/${id}`, data);
      return response.template;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update job template');
    }
  },
);

// Delete job template
export const deleteJobTemplate = createAsyncThunk(
  'jobTemplates/deleteJobTemplate',
  async (templateId: string) => {
    try {
      await apiUtils.delete(`/api/job-templates/${templateId}`);
      return templateId;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete job template');
    }
  },
);
