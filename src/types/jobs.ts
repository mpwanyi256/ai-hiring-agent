import { JobStatus, UserRole } from '@/lib/supabase';
import { JobQuestion } from './interview';

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  category_description?: string;
  category_sort_order?: number;
}

export interface Trait {
  id: string;
  name: string;
  category: string;
  description?: string;
  category_description?: string;
  category_sort_order?: number;
}

export interface JobTemplate {
  id: string;
  name: string;
  title: string;
  fields: {
    skills?: string[];
    experienceLevel?: string;
    traits?: string[];
    jobDescription?: string;
    customFields?: Record<string, { value: string; inputType: string }>;
  };
  interview_format: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  status: 'draft' | 'interviewing' | 'closed';
  createdAt: string;
  updatedAt: string;
  interviewLink?: string;
  candidateCount?: number;
}

export interface QuestionStats {
  total: number;
  required: number;
  optional: number;
  aiGenerated: number;
  custom: number;
  estimatedDuration: number;
}

export interface CurrentJob extends Job {
  questions?: JobQuestion[];
  questionStats?: QuestionStats;
}

export interface JobsState {
  jobs: Job[];
  companyJobs: GetCompanyJobsResponse;
  currentJob: CurrentJob | null;
  isLoading: boolean;
  error: string | null;
  totalJobs: number;
}

export interface CreateJobData {
  profileId: string;
  title: string;
  fields: Job['fields'];
  interviewFormat: 'text' | 'video';
}

export interface UpdateJobData {
  id: string;
  title?: string;
  fields?: Job['fields'];
  interviewFormat?: 'text' | 'video';
  isActive?: boolean;
  status?: 'draft' | 'interviewing' | 'closed';
}

export interface ExperienceLevel {
  value: string;
  label: string;
}

export interface InputType {
  value: 'text' | 'textarea' | 'number' | 'file' | 'url' | 'email';
  label: string;
  icon: string;
}

export interface CustomField {
  key: string;
  value: string;
  inputType: 'text' | 'textarea' | 'number' | 'file' | 'url' | 'email';
}

export interface ExtendedJobsState extends JobsState {
  skills: Skill[];
  traits: Trait[];
  jobTemplates: JobTemplate[];
  skillsLoading: boolean;
  traitsLoading: boolean;
  templatesLoading: boolean;
}

export interface AIQuestionsGenerationResponse {
  questions: Omit<JobQuestion, 'jobId' | 'id' | 'createdAt' | 'updatedAt'>[];
  generation: string;
  success: boolean;
}

export enum CustomFieldInputType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  FILE = 'file',
  URL = 'url',
  EMAIL = 'email',
  MULTI_SELECT = 'multi_select',
}

export enum InterviewFormat {
  TEXT = 'text',
  VIDEO = 'video',
}

export interface JobField {
  id: string;
  label: string;
  required: boolean;
  type: CustomFieldInputType;
  value: string;
}

export interface CompanyJobs {
  id: string;
  profile_id: string;
  title: string;
  fields: {
    skills?: JobField[];
    experienceLevel?: JobField;
    traits?: JobField[];
    jobDescription?: JobField;
    customFields?: Record<string, { value: string; inputType: CustomFieldInputType } | string>;
  };
  interview_format: InterviewFormat;
  interview_token: string;
  is_active: boolean;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  creator_details: {
    id: string;
    role: UserRole;
    email: string;
    first_name: string;
    last_name: string;
  };
  company_id: string;
  company_name: string;
  company_slug: string;
  candidate_count: number;
  completed_interviews: number;
  response_count: number;
  evaluation_count: number;
  average_score: number;
}

export interface GetCompanyJobsPayload {
  company_id: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface GetCompanyJobsResponse {
  jobs: CompanyJobs[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
