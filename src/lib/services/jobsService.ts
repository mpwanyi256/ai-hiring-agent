import { createClient } from '@/lib/supabase/server';
import { generateInterviewToken } from '@/lib/utils';
import { Database } from '@/lib/supabase';
import { app } from '@/lib/constants';
import { GetCompanyJobsPayload, GetCompanyJobsResponse, JobStatus } from '@/types/jobs';

type JobRow = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];

export interface JobFieldsConfig {
  [key: string]: any;
}

export interface JobData {
  id: string;
  profileId: string;
  title: string;
  fields: {
    skills?: string[];
    experienceLevel?: string;
    traits?: string[];
    jobDescription?: string;
    customFields?: Record<string, { value: string; inputType: string }>;
  };
  interviewFormat: 'text' | 'video';
  interviewToken: string;
  isActive: boolean;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  candidateCount?: number;
  interviewLink?: string;
  departmentId: string;
  jobTitleId: string;
  employmentTypeId: string;
  workplaceType: string;
  jobType: string;
}

// Company stats interface matching the database view
export interface CompanyStats {
  company_id: string;
  company_name: string;
  company_slug: string;
  company_created_at: string;
  total_jobs: number;
  active_jobs: number;
  draft_jobs: number;
  interviewing_jobs: number;
  closed_jobs: number;
  total_users: number;
  active_users: number;
  total_candidates: number;
  completed_interviews: number;
  candidates_this_month: number;
  candidates_this_week: number;
  total_responses: number;
  total_evaluations: number;
  free_users: number;
  pro_users: number;
  business_users: number;
  enterprise_users: number;
  last_job_created: string | null;
  last_candidate_created: string | null;
  last_response_created: string | null;
}

// Enhanced job data from detailed view
export interface DetailedJobData extends JobData {
  creator_email: string;
  creator_first_name: string;
  creator_last_name: string;
  company_id: string;
  company_name: string;
  company_slug: string;
  subscription_plan: string;
  max_jobs: number;
  max_interviews_per_month: number;
  total_candidates: number;
  completed_interviews: number;
  interviews_this_month: number;
  interviews_this_week: number;
  interviews_today: number;
  total_responses: number;
  total_evaluations: number;
  average_score: number | null;
  last_candidate_created: string | null;
  last_interview_completed: string | null;
}

// Utility functions to transform between simplified and database formats
function simplifiedToDbFields(simpleFields: JobData['fields']): JobFieldsConfig {
  const dbFields: JobFieldsConfig = {};

  // Convert simple fields to structured JobField format
  if (simpleFields.skills) {
    dbFields.skills = {
      id: 'skills',
      label: 'Skills',
      type: 'multiselect',
      required: false,
      value: simpleFields.skills,
    };
  }

  if (simpleFields.experienceLevel) {
    dbFields.experienceLevel = {
      id: 'experienceLevel',
      label: 'Experience Level',
      type: 'select',
      required: false,
      value: simpleFields.experienceLevel,
    };
  }

  if (simpleFields.traits) {
    dbFields.traits = {
      id: 'traits',
      label: 'Traits',
      type: 'multiselect',
      required: false,
      value: simpleFields.traits,
    };
  }

  if (simpleFields.jobDescription) {
    dbFields.jobDescription = {
      id: 'jobDescription',
      label: 'Job Description',
      type: 'text',
      required: true,
      value: simpleFields.jobDescription,
    };
  }

  // Convert custom fields
  if (simpleFields.customFields) {
    Object.entries(simpleFields.customFields).forEach(([key, fieldData]) => {
      dbFields[key] = {
        id: key,
        label: key,
        type: fieldData.inputType as 'text' | 'select' | 'multiselect' | 'number' | 'boolean',
        required: false,
        value: fieldData.value,
      };
    });
  }

  return dbFields;
}

function dbToSimplifiedFields(dbFields: JobFieldsConfig): JobData['fields'] {
  const simpleFields: JobData['fields'] = {};

  if (dbFields.skills?.value) {
    simpleFields.skills = Array.isArray(dbFields.skills.value)
      ? (dbFields.skills.value as string[])
      : [dbFields.skills.value as string];
  }

  if (dbFields.experienceLevel?.value) {
    simpleFields.experienceLevel = dbFields.experienceLevel.value as string;
  }

  if (dbFields.traits?.value) {
    simpleFields.traits = Array.isArray(dbFields.traits.value)
      ? (dbFields.traits.value as string[])
      : [dbFields.traits.value as string];
  }

  if (dbFields.jobDescription?.value) {
    simpleFields.jobDescription = dbFields.jobDescription.value as string;
  }

  // Convert custom fields
  const customFields: Record<string, { value: string; inputType: string }> = {};
  Object.entries(dbFields).forEach(([key, field]) => {
    if (!['skills', 'experienceLevel', 'traits', 'jobDescription'].includes(key)) {
      customFields[key] = {
        value: String(field.value || ''),
        inputType: field.type,
      };
    }
  });

  if (Object.keys(customFields).length > 0) {
    simpleFields.customFields = customFields;
  }

  return simpleFields;
}

// Utility functions to transform between database and API formats
function transformJobFromDB(dbJob: JobRow): JobData {
  return {
    id: dbJob.id,
    profileId: dbJob.profile_id,
    title: dbJob.title,
    fields: dbToSimplifiedFields(dbJob.fields as JobFieldsConfig),
    interviewFormat: dbJob.interview_format as 'text' | 'video',
    interviewToken: dbJob.interview_token || '',
    isActive: dbJob.is_active || false,
    status: (dbJob.status || 'draft') as JobStatus,
    createdAt: dbJob.created_at || '',
    updatedAt: dbJob.updated_at || '',
    candidateCount: 0, // This would be calculated from candidates table
    departmentId: dbJob.department_id || '',
    jobTitleId: dbJob.job_title_id || '',
    employmentTypeId: dbJob.employment_type_id || '',
    workplaceType: dbJob.workplace_type || '',
    jobType: dbJob.job_type || '',
  };
}

function transformJobToDB(jobData: Partial<JobData>): Partial<JobInsert> {
  const dbData: Partial<JobInsert> = {};

  if (jobData.profileId) dbData.profile_id = jobData.profileId;
  if (jobData.title) dbData.title = jobData.title;
  if (jobData.fields) dbData.fields = simplifiedToDbFields(jobData.fields);
  if (jobData.interviewFormat) dbData.interview_format = jobData.interviewFormat;
  if (jobData.interviewToken) dbData.interview_token = jobData.interviewToken;
  if (jobData.isActive !== undefined) dbData.is_active = jobData.isActive;
  if (jobData.departmentId) dbData.department_id = jobData.departmentId;
  if (jobData.jobTitleId) dbData.job_title_id = jobData.jobTitleId;
  if (jobData.employmentTypeId) dbData.employment_type_id = jobData.employmentTypeId;
  if (jobData.workplaceType)
    dbData.workplace_type = jobData.workplaceType as 'on_site' | 'remote' | 'hybrid';
  if (jobData.jobType)
    dbData.job_type = jobData.jobType as
      | 'full_time'
      | 'part_time'
      | 'contract'
      | 'temporary'
      | 'volunteer'
      | 'internship'
      | 'other';

  return dbData;
}

// Jobs service using Supabase
class JobsService {
  private addInterviewLink(job: JobData): JobData {
    return {
      ...job,
      interviewLink: `${app.baseUrl}/interview/${job.interviewToken}`,
    };
  }

  private async getCandidateCount(jobId: string): Promise<number> {
    try {
      const supabase = await createClient();
      const { count, error } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId);

      if (error) {
        console.error('Error counting candidates:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error counting candidates:', error);
      return 0;
    }
  }

  // New method to get company stats using the view
  async getCompanyStats(companyId: string): Promise<CompanyStats | null> {
    try {
      const supabase = await createClient();
      const { data: stats, error } = await supabase
        .from('company_stats')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Company not found
        }
        throw new Error(error.message);
      }

      return stats;
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw error;
    }
  }

  // New method to get detailed jobs using the view
  async getDetailedJobs(profileId?: string, companyId?: string): Promise<DetailedJobData[]> {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('jobs_detailed')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      } else if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data: jobs, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return jobs.map((job) => ({
        ...job,
        profileId: job.profile_id,
        interviewFormat: job.interview_format as 'text' | 'video',
        interviewToken: job.interview_token,
        isActive: job.is_active,
        status: job.status as JobStatus,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        fields: dbToSimplifiedFields(job.fields),
        interviewLink: `${app.baseUrl}/interview/${job.interview_token}`,
      }));
    } catch (error) {
      console.error('Error fetching detailed jobs:', error);
      throw error;
    }
  }

  async getAllJobs(): Promise<JobData[]> {
    try {
      const supabase = await createClient();
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const jobsWithLinks = jobs.map((job) => {
        const transformed = transformJobFromDB(job);
        return this.addInterviewLink(transformed);
      });

      // Add candidate counts (in parallel for better performance)
      const jobsWithCounts = await Promise.all(
        jobsWithLinks.map(async (job) => ({
          ...job,
          candidateCount: await this.getCandidateCount(job.id),
        })),
      );

      return jobsWithCounts;
    } catch (error) {
      console.error('Error fetching all jobs:', error);
      throw error;
    }
  }

  async getCompanyJobs({
    company_id,
    page,
    limit,
    search,
    status,
  }: GetCompanyJobsPayload): Promise<GetCompanyJobsResponse> {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('jobs_comprehensive')
      .select('*')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query;

    if (error) {
      throw new Error(error?.message || 'Error fetching company jobs');
    }

    const { count, error: countError } = await supabase
      .from('jobs_comprehensive')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company_id);

    if (countError) {
      throw new Error(countError?.message || 'Error fetching company jobs');
    }

    return {
      jobs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil(count || 0 / limit),
        hasMore: offset + limit < (count || 0),
      },
    };
  }

  async getJobsByProfileId(profileId: string): Promise<JobData[]> {
    try {
      const supabase = await createClient();
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const jobsWithLinks = jobs.map((job) => {
        const transformed = transformJobFromDB(job);
        return this.addInterviewLink(transformed);
      });

      // Add candidate counts
      const jobsWithCounts = await Promise.all(
        jobsWithLinks.map(async (job) => ({
          ...job,
          candidateCount: await this.getCandidateCount(job.id),
        })),
      );

      return jobsWithCounts;
    } catch (error) {
      console.error('Error fetching jobs by profile:', error);
      throw error;
    }
  }

  // New paginated method with search and filtering
  async getJobsPaginated(params: {
    profileId: string;
    limit: number;
    offset: number;
    search?: string;
    status?: string;
  }): Promise<{ jobs: JobData[]; total: number }> {
    try {
      const supabase = await createClient();

      // Build the query
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('profile_id', params.profileId);

      // Add search filter if provided
      if (params.search) {
        query = query.ilike('title', `%${params.search}%`);
      }

      // Add status filter if provided
      if (params.status) {
        query = query.eq('status', params.status);
      }

      // Add pagination and ordering
      const {
        data: jobs,
        error,
        count,
      } = await query
        .order('created_at', { ascending: false })
        .range(params.offset, params.offset + params.limit - 1);

      if (error) {
        throw new Error(error.message);
      }

      const jobsWithLinks = jobs.map((job) => {
        const transformed = transformJobFromDB(job);
        return this.addInterviewLink(transformed);
      });

      // Add candidate counts in parallel
      const jobsWithCounts = await Promise.all(
        jobsWithLinks.map(async (job) => ({
          ...job,
          candidateCount: await this.getCandidateCount(job.id),
        })),
      );

      return {
        jobs: jobsWithCounts,
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching paginated jobs:', error);
      throw error;
    }
  }

  async getJobById(id: string): Promise<JobData | null> {
    try {
      const supabase = await createClient();
      const { data: job, error } = await supabase.from('jobs').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Job not found
        }
        throw new Error(error.message);
      }

      const transformed = transformJobFromDB(job);
      const jobWithLink = this.addInterviewLink(transformed);

      // Add candidate count
      jobWithLink.candidateCount = await this.getCandidateCount(id);

      return jobWithLink;
    } catch (error) {
      console.error('Error fetching job by ID:', error);
      throw error;
    }
  }

  async createJob(jobData: {
    profileId: string;
    title: string;
    fields: JobData['fields'];
    interviewFormat: 'text' | 'video';
    departmentId: string;
    jobTitleId: string;
    employmentTypeId: string;
    workplaceType: string;
    jobType: string;
  }): Promise<JobData> {
    try {
      const supabase = await createClient();
      const interviewToken = generateInterviewToken();

      const dbJobData = {
        profile_id: jobData.profileId,
        title: jobData.title,
        fields: simplifiedToDbFields(jobData.fields),
        interview_format: jobData.interviewFormat,
        interview_token: interviewToken,
        is_active: true,
        department_id: jobData.departmentId,
        job_title_id: jobData.jobTitleId,
        employment_type_id: jobData.employmentTypeId,
        workplace_type: jobData.workplaceType,
        job_type: jobData.jobType,
      };

      const { data: job, error } = await supabase.from('jobs').insert(dbJobData).select().single();

      if (error) {
        throw new Error(error.message);
      }

      const transformed = transformJobFromDB(job);
      const jobWithLink = this.addInterviewLink(transformed);
      jobWithLink.candidateCount = 0; // New job has no candidates

      return jobWithLink;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  async updateJob(id: string, updateData: Partial<JobData>): Promise<JobData | null> {
    try {
      const supabase = await createClient();

      const dbUpdateData = transformJobToDB(updateData);

      const { data: job, error } = await supabase
        .from('jobs')
        .update(dbUpdateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Job not found
        }
        throw new Error(error.message);
      }

      const transformed = transformJobFromDB(job);
      const jobWithLink = this.addInterviewLink(transformed);

      // Add candidate count
      jobWithLink.candidateCount = await this.getCandidateCount(id);

      return jobWithLink;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  async updateJobStatus(id: string, status: JobStatus): Promise<JobData | null> {
    return this.updateJob(id, { status });
  }

  async toggleJobActiveStatus(id: string, isActive: boolean): Promise<JobData | null> {
    return this.updateJob(id, { isActive });
  }

  async deleteJob(id: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { error } = await supabase.from('jobs').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  async updateCandidateCount(id: string): Promise<JobData | null> {
    // For now, we'll just return the job since candidate count is calculated
    // In the future, this could be optimized with a denormalized field
    return this.getJobById(id);
  }

  async getJobByToken(token: string): Promise<JobData | null> {
    try {
      const supabase = await createClient();
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('interview_token', token)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Job not found
        }
        throw new Error(error.message);
      }

      const transformed = transformJobFromDB(job);
      const jobWithLink = this.addInterviewLink(transformed);

      // Add candidate count
      jobWithLink.candidateCount = await this.getCandidateCount(job.id);

      return jobWithLink;
    } catch (error) {
      console.error('Error fetching job by token:', error);
      throw error;
    }
  }

  // Statistics methods with enhanced status breakdown
  async getJobStats(profileId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    draft: number;
    interviewing: number;
    closed: number;
    totalCandidates: number;
  }> {
    try {
      const supabase = await createClient();

      let query = supabase.from('jobs').select('id, is_active, status');

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data: jobs, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const stats = {
        total: jobs.length,
        active: jobs.filter((job) => job.is_active).length,
        inactive: jobs.filter((job) => !job.is_active).length,
        draft: jobs.filter((job) => job.status === 'draft').length,
        interviewing: jobs.filter((job) => job.status === 'interviewing').length,
        closed: jobs.filter((job) => job.status === 'closed').length,
        totalCandidates: 0,
      };

      // Get total candidates count
      let candidateQuery = supabase.from('candidates').select('*', { count: 'exact', head: true });

      if (profileId) {
        // We need to join with jobs to filter by profile
        const jobIds = jobs.map((job) => job.id);
        if (jobIds.length > 0) {
          candidateQuery = candidateQuery.in('job_id', jobIds);
        }
      }

      const { count } = await candidateQuery;

      stats.totalCandidates = count || 0;

      return stats;
    } catch (error) {
      console.error('Error getting job stats:', error);
      throw error;
    }
  }

  // Auto-update job status based on candidate activity
  async autoUpdateJobStatus(jobId: string): Promise<void> {
    try {
      const supabase = await createClient();

      // Get candidate count for the job
      const { count } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId)
        .not('submitted_at', 'is', null);

      // Update status based on candidate activity
      let newStatus: JobStatus = 'draft';
      if (count && count > 0) {
        newStatus = 'interviewing';
      }

      await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId)
        .eq('status', 'draft'); // Only update if currently draft
    } catch (error) {
      console.error('Error auto-updating job status:', error);
      // Don't throw error as this is a background operation
    }
  }

  // Get job by interview token (public access for candidates)
  async getJobByInterviewToken(interviewToken: string): Promise<JobData | null> {
    try {
      const supabase = await createClient();

      const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('interview_token', interviewToken)
        .eq('is_active', true)
        .single();

      if (error || !job) {
        return null;
      }

      return {
        id: job.id,
        profileId: job.profile_id,
        title: job.title,
        fields: job.fields,
        interviewFormat: job.interview_format as 'text' | 'video',
        interviewToken: job.interview_token || '',
        isActive: job.is_active || false,
        status: job.status as JobStatus,
        createdAt: job.created_at || '',
        updatedAt: job.updated_at || '',
        departmentId: job.department_id || '',
        jobTitleId: job.job_title_id || '',
        employmentTypeId: job.employment_type_id || '',
        workplaceType: job.workplace_type || '',
        jobType: job.job_type || '',
      };
    } catch (error) {
      console.error('Error getting job by interview token:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const jobsService = new JobsService();
