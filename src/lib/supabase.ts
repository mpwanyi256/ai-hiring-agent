import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { createClient } from './supabase/client'

// Legacy client for backward compatibility
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// New SSR-compatible client (for client components)
export { createClient }

// NOTE: For server components, import directly from './supabase/server'
// export { createClient as createServerClient } from './supabase/server'

// Types for flexible job fields
export interface JobField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'boolean';
  required: boolean;
  options?: string[];
  value?: string | string[] | number | boolean;
}

export interface JobFieldsConfig {
  [key: string]: JobField;
}

// User role enum
export type UserRole = 'recruiter' | 'candidate' | 'admin' | 'developer';

// Database Types
export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          company_id: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          company_id?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          company_id?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number;
          max_jobs: number;
          max_interviews_per_month: number;
          features: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          max_jobs?: number;
          max_interviews_per_month?: number;
          features?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          max_jobs?: number;
          max_interviews_per_month?: number;
          features?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          status: string;
          started_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          status?: string;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          status?: string;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          fields: JobFieldsConfig;
          interview_format: 'text' | 'video';
          interview_token: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          fields?: JobFieldsConfig;
          interview_format?: 'text' | 'video';
          interview_token?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          fields?: JobFieldsConfig;
          interview_format?: 'text' | 'video';
          interview_token?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          job_id: string;
          interview_token: string;
          email?: string;
          submitted_at?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          interview_token: string;
          email?: string;
          submitted_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          interview_token?: string;
          email?: string;
          submitted_at?: string;
          created_at?: string;
        };
      };
      responses: {
        Row: {
          id: string;
          candidate_id: string;
          question: string;
          answer: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          question: string;
          answer: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          question?: string;
          answer?: string;
          created_at?: string;
        };
      };
      evaluations: {
        Row: {
          id: string;
          candidate_id: string;
          summary: string;
          score: number;
          strengths: string[];
          red_flags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          summary: string;
          score: number;
          strengths: string[];
          red_flags: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          summary?: string;
          score?: number;
          strengths?: string[];
          red_flags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      user_details: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: UserRole;
          user_created_at: string;
          user_updated_at: string;
          company_id: string | null;
          company_name: string | null;
          company_slug: string | null;
          company_created_at: string | null;
          subscription_id: string | null;
          subscription_name: string | null;
          subscription_description: string | null;
          price_monthly: number | null;
          price_yearly: number | null;
          max_jobs: number | null;
          max_interviews_per_month: number | null;
          subscription_features: string[] | null;
          subscription_status: string | null;
          subscription_started_at: string | null;
          subscription_expires_at: string | null;
          active_jobs_count: number | null;
          interviews_this_month: number | null;
        };
        Insert: never; // Views don't support insert
        Update: never; // Views don't support update
      };
    };
    Views: {
      user_details: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: UserRole;
          user_created_at: string;
          user_updated_at: string;
          company_id: string | null;
          company_name: string | null;
          company_slug: string | null;
          company_created_at: string | null;
          subscription_id: string | null;
          subscription_name: string | null;
          subscription_description: string | null;
          price_monthly: number | null;
          price_yearly: number | null;
          max_jobs: number | null;
          max_interviews_per_month: number | null;
          subscription_features: string[] | null;
          subscription_status: string | null;
          subscription_started_at: string | null;
          subscription_expires_at: string | null;
          active_jobs_count: number | null;
          interviews_this_month: number | null;
        };
        Insert: never;
        Update: never;
      };
    };
  };
}; 