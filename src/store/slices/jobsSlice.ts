import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

export interface Job {
  id: string;
  employerId: string;
  title: string;
  fields: {
    skills?: string[];
    experienceLevel?: string;
    traits?: string[];
    customFields?: Record<string, string>;
  };
  interviewFormat: 'text' | 'video';
  createdAt: string;
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
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (employerId: string) => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        candidates(count)
      `)
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(job => ({
      id: job.id,
      employerId: job.employer_id,
      title: job.title,
      fields: job.fields || {},
      interviewFormat: job.interview_format,
      createdAt: job.created_at,
      candidateCount: job.candidates?.[0]?.count || 0,
      interviewLink: `${process.env.NEXT_PUBLIC_APP_URL}/interview/${job.id}`,
    }));
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData: {
    employerId: string;
    title: string;
    fields: Job['fields'];
    interviewFormat: 'text' | 'video';
  }) => {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        employer_id: jobData.employerId,
        title: jobData.title,
        fields: jobData.fields,
        interview_format: jobData.interviewFormat,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      employerId: data.employer_id,
      title: data.title,
      fields: data.fields || {},
      interviewFormat: data.interview_format,
      createdAt: data.created_at,
      candidateCount: 0,
      interviewLink: `${process.env.NEXT_PUBLIC_APP_URL}/interview/${data.id}`,
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
  }) => {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        ...(jobData.title && { title: jobData.title }),
        ...(jobData.fields && { fields: jobData.fields }),
        ...(jobData.interviewFormat && { interview_format: jobData.interviewFormat }),
      })
      .eq('id', jobData.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      employerId: data.employer_id,
      title: data.title,
      fields: data.fields || {},
      interviewFormat: data.interview_format,
      createdAt: data.created_at,
      interviewLink: `${process.env.NEXT_PUBLIC_APP_URL}/interview/${data.id}`,
    };
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string) => {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;

    return jobId;
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
      employerId: data.employer_id,
      title: data.title,
      fields: data.fields || {},
      interviewFormat: data.interview_format,
      createdAt: data.created_at,
      candidateCount: data.candidates?.[0]?.count || 0,
      interviewLink: `${process.env.NEXT_PUBLIC_APP_URL}/interview/${data.id}`,
    };
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload;
        state.totalJobs = action.payload.length;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch jobs';
      })
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs.unshift(action.payload);
        state.totalJobs++;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create job';
      })
      // Update Job
      .addCase(updateJob.fulfilled, (state, action) => {
        const index = state.jobs.findIndex(job => job.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = { ...state.jobs[index], ...action.payload };
        }
        if (state.currentJob?.id === action.payload.id) {
          state.currentJob = { ...state.currentJob, ...action.payload };
        }
      })
      // Delete Job
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.jobs = state.jobs.filter(job => job.id !== action.payload);
        state.totalJobs--;
        if (state.currentJob?.id === action.payload) {
          state.currentJob = null;
        }
      })
      // Fetch Job By Id
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.currentJob = action.payload;
      });
  },
});

export const { clearError, setCurrentJob, clearCurrentJob } = jobsSlice.actions;
export default jobsSlice.reducer; 