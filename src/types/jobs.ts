import { JobData } from "@/lib/services/jobsService";
import { JobQuestion } from "./interview";

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

  export interface CurrentJob extends Job {
    questions?: JobQuestion[];
  }

  export interface JobsState {
    jobs: Job[];
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
