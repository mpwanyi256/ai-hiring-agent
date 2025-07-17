import { Database } from '@/lib/supabase';
import { JobQuestion } from './interview';
import z from 'zod';

export type JobStatus = Database['public']['Enums']['job_status'];
export type UserRole = Database['public']['Enums']['user_role'];

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

export interface Department {
  id: string;
  name: string;
}

export interface JobTitle {
  id: string;
  name: string;
}

export interface EmploymentType {
  id: string;
  name: string;
}

export type WorkplaceType = 'on_site' | 'remote' | 'hybrid';
export type JobType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'temporary'
  | 'volunteer'
  | 'internship'
  | 'other';

export interface CreateJobPayload {
  title: string;
  fields: Record<string, unknown>;
  interviewFormat: 'text' | 'video';
  departmentId: string;
  jobTitleId: string;
  employmentTypeId: string;
  workplaceType: string;
  jobType: string;
  saveAsTemplate: boolean;
  templateName?: string;
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
  department?: Department;
  departmentId?: string;
  jobTitle?: JobTitle;
  jobTitleId?: string;
  employmentType?: EmploymentType;
  employmentTypeId?: string;
  workplaceType?: WorkplaceType;
  jobType?: JobType;
  shortlistedCount?: number;
}

export interface QuestionStats {
  total: number;
  required: number;
  optional: number;
  aiGenerated: number;
  custom: number;
  estimatedDuration: number;
}

export interface JobsState {
  jobs: Job[];
  companyJobs: GetCompanyJobsResponse;
  currentJob: Job | null;
  isLoading: boolean;
  error: string | null;
  totalJobs: number;
}

export interface CreateJobData {
  profileId: string;
  title: string;
  fields: Job['fields'];
  interviewFormat: 'text' | 'video';
  departmentId?: string;
  jobTitleId?: string;
  employmentTypeId?: string;
  workplaceType?: WorkplaceType;
  jobType?: JobType;
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
  departments: Department[];
  departmentsLoading: boolean;
  departmentsError: string | null;
  jobTitles: JobTitle[];
  jobTitlesLoading: boolean;
  jobTitlesError: string | null;
  employmentTypes: EmploymentType[];
  employmentTypesLoading: boolean;
  employmentTypesError: string | null;
  questions: JobQuestion[];
  questionStats: QuestionStats;
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
    role: string;
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

export const jobSchema = z.object({
  title: z.string().min(2, 'Job title must be at least 2 characters'),
  skills: z.array(z.string().min(1)).optional(),
  experienceLevel: z.string().optional(),
  traits: z.array(z.string().min(1)).optional(),
  interviewFormat: z.enum(['text', 'video']),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  jobDescriptionUrl: z.string().url().optional().or(z.literal('')),
  customFields: z
    .array(
      z.object({
        key: z.string().min(1, 'Field name is required'),
        value: z.string().min(1, 'Field value is required'),
        inputType: z.enum(['text', 'textarea', 'number', 'file', 'url', 'email']),
      }),
    )
    .optional(),
  saveAsTemplate: z.boolean().optional(),
  templateName: z.string().optional(),
  jobTitleId: z.string().min(1, 'Job title is required'),
  departmentId: z.string().min(1, 'Department is required'),
  employmentTypeId: z.string().min(1, 'Employment type is required'),
  workplaceType: z.string().min(1, 'Workplace type is required'),
  jobType: z.string().min(1, 'Job type is required'),
});

export type JobFormData = z.infer<typeof jobSchema>;

export type AppJobsFields = [string, Record<string, string>];
