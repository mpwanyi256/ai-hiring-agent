import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

export interface Job {
  id: string;
  profileId: string;
  title: string;
  fields: {
    skills?: string[];
    experienceLevel?: string;
    traits?: string[];
    jobDescription?: string;
    customFields?: Record<string, { value: string; inputType: string } | string>;
  };
  interviewFormat: 'text' | 'video';
  interviewToken: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  interviewLink?: string;
  candidateCount?: number;
}

interface JobsState {
  jobs: Job[];
  currentJob: Job | null;
  isLoading: boolean;
  error: string | null;
  totalJobs: number;
}

const initialState: JobsState = {
  jobs: [],
  currentJob: null,
  isLoading: false,
  error: null,
  totalJobs: 0,
};

// Async thunks for jobs
export const fetchJobsByProfile = createAsyncThunk(
  'jobs/fetchJobsByProfile',
  async (profileId: string) => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        candidates(count)
      `)
      .eq('profile_id', profileId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(job => ({
      id: job.id,
      profileId: job.profile_id,
      title: job.title,
      fields: job.fields || {},
      interviewFormat: job.interview_format,
      interviewToken: job.interview_token,
      isActive: job.is_active,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      candidateCount: job.candidates?.length || 0,
      interviewLink: `${process.env.NEXT_PUBLIC_APP_URL}/interview/${job.interview_token}`,
    }));
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId: string) => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        candidates(count)
      `)
      .eq('id', jobId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      profileId: data.profile_id,
      title: data.title,
      fields: data.fields || {},
      interviewFormat: data.interview_format,
      interviewToken: data.interview_token,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      candidateCount: data.candidates?.length || 0,
      interviewLink: `${process.env.NEXT_PUBLIC_APP_URL}/interview/${data.interview_token}`,
    };
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData: {
    profileId: string;
    title: string;
    fields: Job['fields'];
    interviewFormat: 'text' | 'video';
  }) => {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        profile_id: jobData.profileId,
        title: jobData.title,
        fields: jobData.fields,
        interview_format: jobData.interviewFormat,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      profileId: data.profile_id,
      title: data.title,
      fields: data.fields || {},
      interviewFormat: data.interview_format,
      interviewToken: data.interview_token,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      candidateCount: 0,
      interviewLink: `${process.env.NEXT_PUBLIC_APP_URL}/interview/${data.interview_token}`,
    };
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async (jobData: {
    id: string;
    title?: string;
    fields?: Job['fields'];
    interviewFormat?: 'text' | 'video';
    isActive?: boolean;
  }) => {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        ...(jobData.title && { title: jobData.title }),
        ...(jobData.fields && { fields: jobData.fields }),
        ...(jobData.interviewFormat && { interview_format: jobData.interviewFormat }),
        ...(jobData.isActive !== undefined && { is_active: jobData.isActive }),
      })
      .eq('id', jobData.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      profileId: data.profile_id,
      title: data.title,
      fields: data.fields || {},
      interviewFormat: data.interview_format,
      interviewToken: data.interview_token,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      interviewLink: `${process.env.NEXT_PUBLIC_APP_URL}/interview/${data.interview_token}`,
    };
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string) => {
    const { error } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .eq('id', jobId);

    if (error) throw error;

    return jobId;
  }
);

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
      const job = state.jobs.find(j => j.id === action.payload.jobId);
      if (job) {
        job.candidateCount = action.payload.count;
      }
      if (state.currentJob && state.currentJob.id === action.payload.jobId) {
        state.currentJob.candidateCount = action.payload.count;
      }
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.currentJob = action.payload;
      })
      // Create Job
      .addCase(createJob.fulfilled, (state, action) => {
        state.jobs.unshift(action.payload);
        state.totalJobs += 1;
      })
      // Update Job
      .addCase(updateJob.fulfilled, (state, action) => {
        const index = state.jobs.findIndex(job => job.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob && state.currentJob.id === action.payload.id) {
          state.currentJob = action.payload;
        }
      })
      // Delete Job
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.jobs = state.jobs.filter(job => job.id !== action.payload);
        state.totalJobs -= 1;
        if (state.currentJob && state.currentJob.id === action.payload) {
          state.currentJob = null;
        }
      });
  },
});

export const { 
  clearError, 
  setCurrentJob, 
  clearCurrentJob, 
  updateJobCandidateCount 
} = jobsSlice.actions;

export default jobsSlice.reducer; 