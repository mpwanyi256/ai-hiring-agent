import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { JobTemplate } from '@/types/jobs';
import { fetchJobTemplates, createJobTemplate, updateJobTemplate, deleteJobTemplate } from './jobTemplatesThunks';

export interface JobTemplatesState {
  templates: JobTemplate[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: JobTemplatesState = {
  templates: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

const jobTemplatesSlice = createSlice({
  name: 'jobTemplates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTemplates: (state) => {
      state.templates = [];
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Job Templates
      .addCase(fetchJobTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobTemplates.fulfilled, (state, action: PayloadAction<JobTemplate[]>) => {
        state.isLoading = false;
        state.templates = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchJobTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch job templates';
      })
      // Create Job Template
      .addCase(createJobTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJobTemplate.fulfilled, (state, action: PayloadAction<JobTemplate>) => {
        state.isLoading = false;
        state.templates.unshift(action.payload);
      })
      .addCase(createJobTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create job template';
      })
      // Update Job Template
      .addCase(updateJobTemplate.fulfilled, (state, action: PayloadAction<JobTemplate>) => {
        const index = state.templates.findIndex(template => template.id === action.payload.id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
      })
      // Delete Job Template
      .addCase(deleteJobTemplate.fulfilled, (state, action: PayloadAction<string>) => {
        state.templates = state.templates.filter(template => template.id !== action.payload);
      });
  },
});

export const { clearError, clearTemplates } = jobTemplatesSlice.actions;
export default jobTemplatesSlice.reducer; 