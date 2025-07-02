import { createClient } from '@/lib/supabase/server';
import { generateInterviewToken } from '@/lib/utils';
import { Database, JobFieldsConfig } from '@/lib/supabase';
import { app } from '@/lib/constants';

type JobRow = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];

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
  createdAt: string;
  updatedAt: string;
  candidateCount?: number;
  interviewLink?: string;
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
      ? dbFields.skills.value as string[]
      : [dbFields.skills.value as string];
  }
  
  if (dbFields.experienceLevel?.value) {
    simpleFields.experienceLevel = dbFields.experienceLevel.value as string;
  }
  
  if (dbFields.traits?.value) {
    simpleFields.traits = Array.isArray(dbFields.traits.value)
      ? dbFields.traits.value as string[]
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
    fields: dbToSimplifiedFields(dbJob.fields),
    interviewFormat: dbJob.interview_format,
    interviewToken: dbJob.interview_token,
    isActive: dbJob.is_active,
    createdAt: dbJob.created_at,
    updatedAt: dbJob.updated_at,
    candidateCount: 0, // This would be calculated from candidates table
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

      const jobsWithLinks = jobs.map(job => {
        const transformed = transformJobFromDB(job);
        return this.addInterviewLink(transformed);
      });

      // Add candidate counts (in parallel for better performance)
      const jobsWithCounts = await Promise.all(
        jobsWithLinks.map(async (job) => ({
          ...job,
          candidateCount: await this.getCandidateCount(job.id),
        }))
      );

      return jobsWithCounts;
    } catch (error) {
      console.error('Error fetching all jobs:', error);
      throw error;
    }
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

      const jobsWithLinks = jobs.map(job => {
        const transformed = transformJobFromDB(job);
        return this.addInterviewLink(transformed);
      });

      // Add candidate counts
      const jobsWithCounts = await Promise.all(
        jobsWithLinks.map(async (job) => ({
          ...job,
          candidateCount: await this.getCandidateCount(job.id),
        }))
      );

      return jobsWithCounts;
    } catch (error) {
      console.error('Error fetching jobs by profile:', error);
      throw error;
    }
  }

  async getJobById(id: string): Promise<JobData | null> {
    try {
      const supabase = await createClient();
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
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
      console.error('Error fetching job by ID:', error);
      throw error;
    }
  }

  async createJob(jobData: {
    profileId: string;
    title: string;
    fields: JobData['fields'];
    interviewFormat: 'text' | 'video';
  }): Promise<JobData> {
    try {
      const supabase = await createClient();
      const interviewToken = generateInterviewToken();
      
      const dbJobData: JobInsert = {
        profile_id: jobData.profileId,
        title: jobData.title,
        fields: simplifiedToDbFields(jobData.fields),
        interview_format: jobData.interviewFormat,
        interview_token: interviewToken,
        is_active: true,
      };

      const { data: job, error } = await supabase
        .from('jobs')
        .insert(dbJobData)
        .select()
        .single();

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

  async updateJobStatus(id: string, isActive: boolean): Promise<JobData | null> {
    return this.updateJob(id, { isActive });
  }

  async deleteJob(id: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

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

  // Statistics methods
  async getJobStats(profileId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalCandidates: number;
  }> {
    try {
      const supabase = await createClient();
      
      let query = supabase.from('jobs').select('id, is_active');
      
      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data: jobs, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const stats = {
        total: jobs.length,
        active: jobs.filter(job => job.is_active).length,
        inactive: jobs.filter(job => !job.is_active).length,
        totalCandidates: 0,
      };

      // Get total candidates count
      let candidateQuery = supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true });

      if (profileId) {
        // We need to join with jobs to filter by profile
        const jobIds = jobs.map(job => job.id);
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
}

// Export a singleton instance
export const jobsService = new JobsService(); 