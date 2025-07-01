import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database Types (will be generated later)
export type Database = {
  public: {
    Tables: {
      employers: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          company_name: string;
          tier: 'free' | 'pro' | 'premium';
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          company_name: string;
          tier?: 'free' | 'pro' | 'premium';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          company_name?: string;
          tier?: 'free' | 'pro' | 'premium';
          created_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          employer_id: string;
          title: string;
          fields: any; // JSONB for flexible custom fields
          interview_format: 'text' | 'video';
          created_at: string;
        };
        Insert: {
          id?: string;
          employer_id: string;
          title: string;
          fields?: any;
          interview_format?: 'text' | 'video';
          created_at?: string;
        };
        Update: {
          id?: string;
          employer_id?: string;
          title?: string;
          fields?: any;
          interview_format?: 'text' | 'video';
          created_at?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          job_id: string;
          interview_token: string;
          email?: string;
          submitted_at?: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          interview_token: string;
          email?: string;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          interview_token?: string;
          email?: string;
          submitted_at?: string;
        };
      };
      responses: {
        Row: {
          id: string;
          candidate_id: string;
          question: string;
          answer: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          question: string;
          answer: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          question?: string;
          answer?: string;
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
        };
        Insert: {
          id?: string;
          candidate_id: string;
          summary: string;
          score: number;
          strengths: string[];
          red_flags: string[];
        };
        Update: {
          id?: string;
          candidate_id?: string;
          summary?: string;
          score?: number;
          strengths?: string[];
          red_flags?: string[];
        };
      };
    };
  };
}; 