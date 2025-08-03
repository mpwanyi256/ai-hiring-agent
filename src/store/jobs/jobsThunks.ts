import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  AIQuestionsGenerationResponse,
  APIResponse,
  GetCompanyJobsPayload,
  GetCompanyJobsResponse,
  Job,
  JobTemplate,
  QuestionStats,
  Skill,
  Trait,
  UpdateJobData,
  Department,
  JobTitle,
  EmploymentType,
  CreateJobPayload,
} from '@/types';
import { apiUtils } from '../api';
import { RootState } from '..';
import { JobQuestion } from '@/types/interview';
import { refreshUserData } from '../auth/authThunks';

// Response type interfaces
interface JobsResponse {
  jobs: Job[];
}

interface JobResponse {
  job: Job;
}

interface SkillsResponse {
  skills: Skill[];
}

interface TraitsResponse {
  traits: Trait[];
}

interface JobTemplatesResponse {
  templates: JobTemplate[];
}

interface JobTemplateResponse {
  template: JobTemplate;
}

interface JobQuestionsResponse {
  questions: JobQuestion[];
  stats: QuestionStats;
}

interface DepartmentsResponse {
  departments: Department[];
}

interface JobTitlesResponse {
  jobTitles: JobTitle[];
}

interface EmploymentTypesResponse {
  employmentTypes: EmploymentType[];
}

export const fetchJobsPaginated = createAsyncThunk<
  GetCompanyJobsResponse,
  Omit<GetCompanyJobsPayload, 'company_id'>
>('jobs/fetchJobsPaginated', async (params, { getState }) => {
  const state = getState() as RootState;
  const user = state.auth.user;

  if (!user) {
    throw new Error('You must be authenticated to fetch jobs');
  }

  const response = await apiUtils.get<APIResponse<GetCompanyJobsResponse>>(
    `/api/company/${user.companyId}/jobs`,
    {
      params: {
        ...params,
        company_id: user.companyId,
      },
    },
  );

  return response.data;
});

// Async thunks for jobs using API routes
export const fetchJobsByProfile = createAsyncThunk(
  'jobs/fetchJobsByProfile',
  async (profileId: string) => {
    try {
      const response = await apiUtils.get<JobsResponse>(`/api/jobs?profileId=${profileId}`);
      return response.jobs;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch jobs');
    }
  },
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId: string, { dispatch }) => {
    try {
      const response = await apiUtils.get<JobResponse>(`/api/jobs/${jobId}`);
      const job = response.job;
      dispatch(fetchJobQuestions(jobId));
      return job;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch job');
    }
  },
);

export const createJob = createAsyncThunk<Job, CreateJobPayload>(
  'jobs/createJob',
  async (jobData, { rejectWithValue, getState, dispatch }) => {
    try {
      const state = getState() as RootState;
      const user = state.auth.user;
      if (!user) {
        throw new Error('You must be authenticated to create a job');
      }
      const response = await apiUtils.post<JobResponse>('/api/jobs', {
        ...jobData,
        profileId: user.id,
      });

      if (jobData.saveAsTemplate) {
        dispatch(
          saveJobTemplate({
            profileId: user.id,
            name: jobData.templateName || jobData.title,
            title: jobData.title,
            fields: jobData.fields,
            interviewFormat: jobData.interviewFormat,
          }),
        );
      }

      // refresh user data
      Promise.all([
        dispatch(refreshUserData()),
        dispatch(
          generateJobQuestions({
            jobId: response.job.id,
            questionCount: 5,
            includeCustom: true,
            replaceExisting: true,
          }),
        ),
      ]);

      return response.job;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create job');
    }
  },
);

export const updateJob = createAsyncThunk('jobs/updateJob', async (jobData: UpdateJobData) => {
  try {
    const response = await apiUtils.put<JobResponse>(`/api/jobs/${jobData.id}`, jobData);
    return response.job;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update job');
  }
});

export const deleteJob = createAsyncThunk('jobs/deleteJob', async (jobId: string) => {
  try {
    await apiUtils.delete(`/api/jobs/${jobId}`);
    return jobId;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete job');
  }
});

export const toggleJobStatus = createAsyncThunk(
  'jobs/toggleJobStatus',
  async ({ jobId, isActive }: { jobId: string; isActive: boolean }) => {
    try {
      const response = await apiUtils.patch<JobResponse>(`/api/jobs/${jobId}/status`, { isActive });
      return response.job;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to toggle job status');
    }
  },
);

// Thunks for job-related data
export const fetchSkills = createAsyncThunk('jobs/fetchSkills', async () => {
  try {
    const response = await apiUtils.get<SkillsResponse>('/api/skills');
    return response.skills;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch skills');
  }
});

export const fetchTraits = createAsyncThunk('jobs/fetchTraits', async () => {
  try {
    const response = await apiUtils.get<TraitsResponse>('/api/traits');
    return response.traits;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch traits');
  }
});

export const fetchJobTemplates = createAsyncThunk(
  'jobs/fetchJobTemplates',
  async (profileId: string) => {
    try {
      const response = await apiUtils.get<JobTemplatesResponse>(
        `/api/job-templates?profileId=${profileId}`,
      );
      return response.templates;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch job templates');
    }
  },
);

export const saveJobTemplate = createAsyncThunk(
  'jobs/saveJobTemplate',
  async (templateData: {
    profileId: string;
    name: string;
    title: string;
    fields: Record<string, unknown>;
    interviewFormat: string;
  }) => {
    try {
      const response = await apiUtils.post<JobTemplateResponse>('/api/job-templates', templateData);
      return response.template;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to save job template');
    }
  },
);

export const updateJobStatus = createAsyncThunk(
  'jobs/updateJobStatus',
  async ({ jobId, status }: { jobId: string; status: 'draft' | 'interviewing' | 'closed' }) => {
    try {
      const response = await apiUtils.put<JobResponse>(`/api/jobs/${jobId}`, { status });
      return response.job;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update job status');
    }
  },
);

export const fetchJobQuestions = createAsyncThunk(
  'jobs/fetchJobQuestions',
  async (jobId: string) => {
    try {
      const response = await apiUtils.get<JobQuestionsResponse>(`/api/jobs/${jobId}/questions`);
      return response;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch job questions');
    }
  },
);

export const generateJobQuestions = createAsyncThunk(
  'jobs/generateJobQuestions',
  async (
    {
      jobId,
      questionCount = 8,
      includeCustom = true,
      replaceExisting = false,
    }: {
      jobId: string;
      questionCount?: number;
      includeCustom?: boolean;
      replaceExisting?: boolean;
    },
    { dispatch },
  ) => {
    try {
      const response = await apiUtils.post<AIQuestionsGenerationResponse>(
        `/api/jobs/${jobId}/questions`,
        {
          questionCount,
          includeCustom,
          replaceExisting,
        },
      );
      dispatch(fetchJobQuestions(jobId));
      return response;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to generate questions');
    }
  },
);

export const addManualQuestion = createAsyncThunk(
  'jobs/addManualQuestion',
  async (
    {
      jobId,
      questionData,
    }: {
      jobId: string;
      questionData: {
        questionText: string;
        questionType: 'general' | 'technical' | 'behavioral' | 'experience';
        category?: string;
        expectedDuration?: number;
        isRequired?: boolean;
      };
    },
    { dispatch },
  ) => {
    try {
      const response = await apiUtils.post(`/api/jobs/${jobId}/questions`, {
        type: 'manual',
        ...questionData,
      });
      dispatch(fetchJobQuestions(jobId));
      return response;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add manual question');
    }
  },
);

export const deleteJobTemplate = createAsyncThunk(
  'jobs/deleteJobTemplate',
  async (templateId: string) => {
    try {
      await apiUtils.delete(`/api/job-templates/${templateId}`);
      return templateId;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete job template');
    }
  },
);

export const reorderJobQuestions = createAsyncThunk(
  'jobs/reorderJobQuestions',
  async ({ questionIdsOrder }: { questionIdsOrder: string[] }, { getState, dispatch }) => {
    try {
      const job = (getState() as RootState).jobs.currentJob;
      if (!job) {
        throw new Error('Job not found');
      }

      const jobId = job.id;
      const response = await apiUtils.put(`/api/jobs/${jobId}/questions/reorder`, {
        questionIds: questionIdsOrder,
      });
      await dispatch(fetchJobQuestions(jobId));
      return response;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reorder job questions');
    }
  },
);

export const updateJobQuestion = createAsyncThunk(
  'jobs/updateJobQuestion',
  async (
    { questionId, questionText }: { questionId: string; questionText: string },
    { getState, dispatch },
  ) => {
    try {
      const job = (getState() as RootState).jobs.currentJob;
      if (!job) {
        throw new Error('Job not found');
      }
      const jobId = job.id;
      const response = await apiUtils.put(`/api/jobs/${jobId}/questions/${questionId}`, {
        questionText,
      });
      await dispatch(fetchJobQuestions(jobId));
      return response;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update job question');
    }
  },
);

export const fetchDepartments = createAsyncThunk('jobs/fetchDepartments', async () => {
  try {
    const response = await apiUtils.get<DepartmentsResponse>('/api/departments');
    return response.departments;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch departments');
  }
});

export const fetchJobTitles = createAsyncThunk('jobs/fetchJobTitles', async () => {
  try {
    const response = await apiUtils.get<JobTitlesResponse>('/api/job-titles');
    return response.jobTitles;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch job titles');
  }
});

export const fetchEmploymentTypes = createAsyncThunk('jobs/fetchEmploymentTypes', async () => {
  try {
    const response = await apiUtils.get<EmploymentTypesResponse>('/api/employment-types');
    return response.employmentTypes;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch employment types');
  }
});

// Create new entities
export const createDepartment = createAsyncThunk('jobs/createDepartment', async (name: string) => {
  try {
    const response = await apiUtils.post<{ department: Department }>('/api/departments', { name });
    return response.department;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create department');
  }
});

export const createJobTitle = createAsyncThunk('jobs/createJobTitle', async (name: string) => {
  try {
    const response = await apiUtils.post<{ jobTitle: JobTitle }>('/api/job-titles', { name });
    return response.jobTitle;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create job title');
  }
});

export const createEmploymentType = createAsyncThunk(
  'jobs/createEmploymentType',
  async (name: string) => {
    try {
      const response = await apiUtils.post<{ employmentType: EmploymentType }>(
        '/api/employment-types',
        { name },
      );
      return response.employmentType;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create employment type');
    }
  },
);

export const generateJobDescriptionWithAI = createAsyncThunk(
  'jobs/generateJobDescriptionWithAI',
  async (
    jobDetails: {
      title: string;
      departmentId: string;
      employmentTypeId: string;
      workplaceType: string;
      jobType: string;
      experienceLevel?: string;
      skills?: string[];
      traits?: string[];
      // Add department and employment type display names for mapping
      departmentName?: string;
      employmentTypeName?: string;
    },
    { rejectWithValue, getState },
  ) => {
    try {
      // Get the state to access departments and employment types for mapping
      const state = getState() as RootState;
      const departments = state.jobs.departments;
      const employmentTypes = state.jobs.employmentTypes;

      // Map IDs to display names
      const department =
        departments.find((d) => d.id === jobDetails.departmentId)?.name ||
        jobDetails.departmentName ||
        'Unknown Department';
      const employmentType =
        employmentTypes.find((et) => et.id === jobDetails.employmentTypeId)?.name ||
        jobDetails.employmentTypeName ||
        'Unknown Employment Type';

      const res = await fetch('/api/job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobDetails.title,
          department,
          employmentType,
          workplaceType: jobDetails.workplaceType,
          jobType: jobDetails.jobType,
          experienceLevel: jobDetails.experienceLevel,
          skills: jobDetails.skills,
          traits: jobDetails.traits,
        }),
      });
      const data = await res.json();
      if (data.success && data.html) {
        return data.html as string;
      } else {
        return rejectWithValue(data.error || 'Failed to generate job description');
      }
    } catch {
      return rejectWithValue('Failed to generate job description');
    }
  },
);
