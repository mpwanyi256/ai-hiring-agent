import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Job, ExtendedJobsState } from '@/types';
import {
  fetchJobsByProfile,
  fetchJobById,
  createJob,
  updateJob,
  deleteJob,
  toggleJobStatus,
  updateJobStatus,
  fetchSkills,
  fetchTraits,
  fetchJobTemplates,
  saveJobTemplate,
  deleteJobTemplate,
  fetchJobQuestions,
  fetchJobsPaginated,
} from './jobsThunks';
import { parseJobDetails } from '@/lib/utils';

const initialState: ExtendedJobsState = {
  jobs: [],
  companyJobs: {
    jobs: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasMore: false,
    },
  },
  currentJob: null,
  isLoading: false,
  error: null,
  totalJobs: 0,
  skills: [],
  traits: [],
  jobTemplates: [],
  skillsLoading: false,
  traitsLoading: false,
  templatesLoading: false,
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentJob: (state, action: PayloadAction<Job | null>) => {
      state.currentJob = action.payload;
    },
    clearCurrentJob: (state) => {
      state.currentJob = null;
    },
    updateJobCandidateCount: (state, action: PayloadAction<{ jobId: string; count: number }>) => {
      const job = state.jobs.find((j) => j.id === action.payload.jobId);
      if (job) {
        job.candidateCount = action.payload.count;
      }
      if (state.currentJob && state.currentJob.id === action.payload.jobId) {
        state.currentJob.candidateCount = action.payload.count;
      }
    },
    resetCurrentJob: (state) => {
      state.currentJob = null;
    },
    clearJobsData: (state) => {
      state.jobs = [];
      state.currentJob = null;
      state.totalJobs = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobsPaginated.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobsPaginated.fulfilled, (state, { payload }) => {
        const { jobs, pagination } = payload;
        state.isLoading = false;
        state.companyJobs.jobs =
          pagination.page === 1 ? jobs : [...state.companyJobs.jobs, ...jobs];
        state.companyJobs.pagination = pagination;
      })
      .addCase(fetchJobsPaginated.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch jobs';
      })
      .addCase(fetchJobQuestions.fulfilled, (state, action) => {
        if (state.currentJob) {
          state.currentJob.questions = action.payload.questions;
          state.currentJob.questionStats = action.payload.stats;
        }
      })
      // Fetch Jobs by Profile
      .addCase(fetchJobsByProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobsByProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload;
        state.totalJobs = action.payload.length;
      })
      .addCase(fetchJobsByProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch jobs';
      })
      // Fetch Job by ID
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentJob = parseJobDetails(action.payload);
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch job';
      })
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs.unshift(action.payload);
        state.totalJobs += 1;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create job';
      })
      // Update Job
      .addCase(updateJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.jobs.findIndex((job) => job.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob && state.currentJob.id === action.payload.id) {
          state.currentJob = action.payload;
        }
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update job';
      })
      // Delete Job
      .addCase(deleteJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = state.jobs.filter((job) => job.id !== action.payload);
        state.totalJobs -= 1;
        if (state.currentJob && state.currentJob.id === action.payload) {
          state.currentJob = null;
        }
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete job';
      })
      // Toggle Job Status
      .addCase(toggleJobStatus.fulfilled, (state, action) => {
        const index = state.jobs.findIndex((job) => job.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob && state.currentJob.id === action.payload.id) {
          state.currentJob = action.payload;
        }
      })
      // Update Job Status
      .addCase(updateJobStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateJobStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.jobs.findIndex((job) => job.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob && state.currentJob.id === action.payload.id) {
          state.currentJob = action.payload;
        }
      })
      .addCase(updateJobStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update job status';
      })
      // Fetch Skills
      .addCase(fetchSkills.pending, (state) => {
        state.skillsLoading = true;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.skillsLoading = false;
        state.skills = action.payload;
      })
      .addCase(fetchSkills.rejected, (state) => {
        state.skillsLoading = false;
      })
      // Fetch Traits
      .addCase(fetchTraits.pending, (state) => {
        state.traitsLoading = true;
      })
      .addCase(fetchTraits.fulfilled, (state, action) => {
        state.traitsLoading = false;
        state.traits = action.payload;
      })
      .addCase(fetchTraits.rejected, (state) => {
        state.traitsLoading = false;
      })
      // Fetch Job Templates
      .addCase(fetchJobTemplates.pending, (state) => {
        state.templatesLoading = true;
      })
      .addCase(fetchJobTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.jobTemplates = action.payload;
      })
      .addCase(fetchJobTemplates.rejected, (state) => {
        state.templatesLoading = false;
      })
      // Save Job Template
      .addCase(saveJobTemplate.fulfilled, (state, action) => {
        state.jobTemplates.unshift(action.payload);
      })
      // Delete Job Template
      .addCase(deleteJobTemplate.fulfilled, (state, action) => {
        state.jobTemplates = state.jobTemplates.filter(
          (template) => template.id !== action.payload,
        );
      });
  },
});

export const {
  clearError,
  setCurrentJob,
  clearCurrentJob,
  updateJobCandidateCount,
  clearJobsData,
  resetCurrentJob,
} = jobsSlice.actions;

export default jobsSlice.reducer;
