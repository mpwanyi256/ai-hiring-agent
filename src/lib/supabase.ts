export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  public: {
    Tables: {
      ai_evaluations: {
        Row: {
          ai_model_version: string | null;
          areas_for_improvement: Json;
          candidate_id: string;
          category_scores: Json;
          created_at: string | null;
          evaluation_explanation: string;
          evaluation_sources: Json;
          evaluation_summary: string;
          evaluation_version: string | null;
          id: string;
          job_id: string;
          key_strengths: Json;
          overall_score: number;
          overall_status: string;
          processing_duration_ms: number | null;
          radar_metrics: Json;
          recommendation: string;
          red_flags: Json;
          updated_at: string | null;
        };
        Insert: {
          ai_model_version?: string | null;
          areas_for_improvement?: Json;
          candidate_id: string;
          category_scores?: Json;
          created_at?: string | null;
          evaluation_explanation: string;
          evaluation_sources?: Json;
          evaluation_summary: string;
          evaluation_version?: string | null;
          id?: string;
          job_id: string;
          key_strengths?: Json;
          overall_score: number;
          overall_status: string;
          processing_duration_ms?: number | null;
          radar_metrics?: Json;
          recommendation: string;
          red_flags?: Json;
          updated_at?: string | null;
        };
        Update: {
          ai_model_version?: string | null;
          areas_for_improvement?: Json;
          candidate_id?: string;
          category_scores?: Json;
          created_at?: string | null;
          evaluation_explanation?: string;
          evaluation_sources?: Json;
          evaluation_summary?: string;
          evaluation_version?: string | null;
          id?: string;
          job_id?: string;
          key_strengths?: Json;
          overall_score?: number;
          overall_status?: string;
          processing_duration_ms?: number | null;
          radar_metrics?: Json;
          recommendation?: string;
          red_flags?: Json;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_evaluations_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_evaluations_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_evaluations_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'ai_evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'accessible_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_analytics_summary';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'ai_evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'ai_evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'ai_evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'user_jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_model_usage: {
        Row: {
          capability: string;
          company_id: string;
          cost: number;
          id: string;
          model_id: string;
          request_count: number;
          timestamp: string | null;
          tokens_used: number;
          user_id: string;
        };
        Insert: {
          capability: string;
          company_id: string;
          cost?: number;
          id?: string;
          model_id: string;
          request_count?: number;
          timestamp?: string | null;
          tokens_used?: number;
          user_id: string;
        };
        Update: {
          capability?: string;
          company_id?: string;
          cost?: number;
          id?: string;
          model_id?: string;
          request_count?: number;
          timestamp?: string | null;
          tokens_used?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_model_usage_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_preferences: {
        Row: {
          company_id: string;
          config: Json;
          created_at: string | null;
          id: string;
          provider_configs: Json;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          company_id: string;
          config?: Json;
          created_at?: string | null;
          id?: string;
          provider_configs?: Json;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          company_id?: string;
          config?: Json;
          created_at?: string | null;
          id?: string;
          provider_configs?: Json;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_preferences_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_preferences_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_preferences_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_preferences_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_preferences_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_preferences_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_preferences_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'ai_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      candidate_analytics: {
        Row: {
          ai_summary: string | null;
          candidate_id: string;
          certifications: Json | null;
          confidence_score: number | null;
          created_at: string | null;
          education_level: string | null;
          error_message: string | null;
          experience_years: number | null;
          id: string;
          job_id: string;
          processing_status: string | null;
          red_flags: Json | null;
          resume_analysis: Json | null;
          resume_score: number | null;
          resume_text: string | null;
          skills_extracted: Json | null;
          strengths: Json | null;
          updated_at: string | null;
        };
        Insert: {
          ai_summary?: string | null;
          candidate_id: string;
          certifications?: Json | null;
          confidence_score?: number | null;
          created_at?: string | null;
          education_level?: string | null;
          error_message?: string | null;
          experience_years?: number | null;
          id?: string;
          job_id: string;
          processing_status?: string | null;
          red_flags?: Json | null;
          resume_analysis?: Json | null;
          resume_score?: number | null;
          resume_text?: string | null;
          skills_extracted?: Json | null;
          strengths?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          ai_summary?: string | null;
          candidate_id?: string;
          certifications?: Json | null;
          confidence_score?: number | null;
          created_at?: string | null;
          education_level?: string | null;
          error_message?: string | null;
          experience_years?: number | null;
          id?: string;
          job_id?: string;
          processing_status?: string | null;
          red_flags?: Json | null;
          resume_analysis?: Json | null;
          resume_score?: number | null;
          resume_text?: string | null;
          skills_extracted?: Json | null;
          strengths?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'candidate_analytics_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_analytics_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_analytics_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
        ];
      };
      candidate_response_analytics: {
        Row: {
          ai_insights: Json | null;
          candidate_id: string;
          created_at: string | null;
          id: string;
          keyword_matches: Json | null;
          processing_status: string | null;
          question_text: string | null;
          readability_score: number | null;
          response_id: string;
          response_quality: string | null;
          response_text: string;
          sentiment_score: number | null;
          updated_at: string | null;
        };
        Insert: {
          ai_insights?: Json | null;
          candidate_id: string;
          created_at?: string | null;
          id?: string;
          keyword_matches?: Json | null;
          processing_status?: string | null;
          question_text?: string | null;
          readability_score?: number | null;
          response_id: string;
          response_quality?: string | null;
          response_text: string;
          sentiment_score?: number | null;
          updated_at?: string | null;
        };
        Update: {
          ai_insights?: Json | null;
          candidate_id?: string;
          created_at?: string | null;
          id?: string;
          keyword_matches?: Json | null;
          processing_status?: string | null;
          question_text?: string | null;
          readability_score?: number | null;
          response_id?: string;
          response_quality?: string | null;
          response_text?: string;
          sentiment_score?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'candidate_response_analytics_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_response_analytics_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_response_analytics_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'candidate_response_analytics_response_id_fkey';
            columns: ['response_id'];
            isOneToOne: false;
            referencedRelation: 'responses';
            referencedColumns: ['id'];
          },
        ];
      };
      candidate_resumes: {
        Row: {
          candidate_id: string | null;
          created_at: string | null;
          email: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          job_id: string;
          original_filename: string;
          parsing_error: string | null;
          parsing_status: string | null;
          public_url: string | null;
          updated_at: string | null;
          word_count: number | null;
        };
        Insert: {
          candidate_id?: string | null;
          created_at?: string | null;
          email: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          job_id: string;
          original_filename: string;
          parsing_error?: string | null;
          parsing_status?: string | null;
          public_url?: string | null;
          updated_at?: string | null;
          word_count?: number | null;
        };
        Update: {
          candidate_id?: string | null;
          created_at?: string | null;
          email?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          job_id?: string;
          original_filename?: string;
          parsing_error?: string | null;
          parsing_status?: string | null;
          public_url?: string | null;
          updated_at?: string | null;
          word_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'candidate_resumes_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_resumes_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_resumes_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
        ];
      };
      candidates: {
        Row: {
          candidate_info_id: string | null;
          candidate_status: string | null;
          created_at: string | null;
          current_step: number | null;
          id: string;
          interview_token: string | null;
          is_completed: boolean | null;
          job_id: string;
          submitted_at: string | null;
          total_steps: number | null;
          updated_at: string | null;
        };
        Insert: {
          candidate_info_id?: string | null;
          candidate_status?: string | null;
          created_at?: string | null;
          current_step?: number | null;
          id?: string;
          interview_token?: string | null;
          is_completed?: boolean | null;
          job_id: string;
          submitted_at?: string | null;
          total_steps?: number | null;
          updated_at?: string | null;
        };
        Update: {
          candidate_info_id?: string | null;
          candidate_status?: string | null;
          created_at?: string | null;
          current_step?: number | null;
          id?: string;
          interview_token?: string | null;
          is_completed?: boolean | null;
          job_id?: string;
          submitted_at?: string | null;
          total_steps?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'candidates_candidate_info_id_fkey';
            columns: ['candidate_info_id'];
            isOneToOne: false;
            referencedRelation: 'candidates_info';
            referencedColumns: ['id'];
          },
        ];
      };
      candidates_info: {
        Row: {
          additional_info: Json | null;
          created_at: string | null;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          linkedin_url: string | null;
          phone: string | null;
          portfolio_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          additional_info?: Json | null;
          created_at?: string | null;
          email: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          linkedin_url?: string | null;
          phone?: string | null;
          portfolio_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          additional_info?: Json | null;
          created_at?: string | null;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          linkedin_url?: string | null;
          phone?: string | null;
          portfolio_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          sort_order: number | null;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          sort_order?: number | null;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          sort_order?: number | null;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          bio: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          industry: string | null;
          logo_path: string | null;
          logo_url: string | null;
          name: string;
          size_range: string | null;
          slug: string | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          bio?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          industry?: string | null;
          logo_path?: string | null;
          logo_url?: string | null;
          name: string;
          size_range?: string | null;
          slug?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          bio?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          industry?: string | null;
          logo_path?: string | null;
          logo_url?: string | null;
          name?: string;
          size_range?: string | null;
          slug?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      contract_offers: {
        Row: {
          additional_terms: Json | null;
          candidate_id: string;
          contract_id: string;
          created_at: string | null;
          end_date: string | null;
          expires_at: string | null;
          id: string;
          rejected_at: string | null;
          rejection_reason: string | null;
          salary_amount: number | null;
          salary_currency: string | null;
          sent_at: string | null;
          sent_by: string;
          signed_at: string | null;
          signed_copy_url: string | null;
          signing_token: string;
          start_date: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          additional_terms?: Json | null;
          candidate_id: string;
          contract_id: string;
          created_at?: string | null;
          end_date?: string | null;
          expires_at?: string | null;
          id?: string;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          salary_amount?: number | null;
          salary_currency?: string | null;
          sent_at?: string | null;
          sent_by: string;
          signed_at?: string | null;
          signed_copy_url?: string | null;
          signing_token?: string;
          start_date?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          additional_terms?: Json | null;
          candidate_id?: string;
          contract_id?: string;
          created_at?: string | null;
          end_date?: string | null;
          expires_at?: string | null;
          id?: string;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          salary_amount?: number | null;
          salary_currency?: string | null;
          sent_at?: string | null;
          sent_by?: string;
          signed_at?: string | null;
          signed_copy_url?: string | null;
          signing_token?: string;
          start_date?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contract_offers_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contract_offers_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contract_offers_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'contract_offers_contract_id_fkey';
            columns: ['contract_id'];
            isOneToOne: false;
            referencedRelation: 'contracts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contract_offers_salary_currency_fkey';
            columns: ['salary_currency'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'contract_offers_sent_by_fkey';
            columns: ['sent_by'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'contract_offers_sent_by_fkey';
            columns: ['sent_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contract_offers_sent_by_fkey';
            columns: ['sent_by'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      contracts: {
        Row: {
          category: Database['public']['Enums']['contract_category'] | null;
          company_id: string;
          content: string;
          created_at: string | null;
          created_by: string;
          description: string | null;
          id: string;
          is_public: boolean | null;
          is_template: boolean | null;
          parent_contract_id: string | null;
          status: Database['public']['Enums']['contract_status'] | null;
          template_data: Json | null;
          title: string;
          updated_at: string | null;
          usage_count: number | null;
          version: number | null;
        };
        Insert: {
          category?: Database['public']['Enums']['contract_category'] | null;
          company_id: string;
          content: string;
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          is_template?: boolean | null;
          parent_contract_id?: string | null;
          status?: Database['public']['Enums']['contract_status'] | null;
          template_data?: Json | null;
          title: string;
          updated_at?: string | null;
          usage_count?: number | null;
          version?: number | null;
        };
        Update: {
          category?: Database['public']['Enums']['contract_category'] | null;
          company_id?: string;
          content?: string;
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          is_template?: boolean | null;
          parent_contract_id?: string | null;
          status?: Database['public']['Enums']['contract_status'] | null;
          template_data?: Json | null;
          title?: string;
          updated_at?: string | null;
          usage_count?: number | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contracts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contracts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'contracts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'contracts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'contracts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'contracts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'contracts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'contracts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'contracts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contracts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contracts_parent_contract_id_fkey';
            columns: ['parent_contract_id'];
            isOneToOne: false;
            referencedRelation: 'contracts';
            referencedColumns: ['id'];
          },
        ];
      };
      countries: {
        Row: {
          code: string;
          continent: string;
          created_at: string | null;
          id: string;
          name: string;
        };
        Insert: {
          code: string;
          continent: string;
          created_at?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          code?: string;
          continent?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      currencies: {
        Row: {
          code: string;
          created_at: string | null;
          decimal_places: number | null;
          id: string;
          is_active: boolean | null;
          name: string;
          symbol: string;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          decimal_places?: number | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          symbol: string;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          decimal_places?: number | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          symbol?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'departments_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'departments_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'departments_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'departments_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'departments_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'departments_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'departments_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
        ];
      };
      employment: {
        Row: {
          candidate_id: string | null;
          contract_offer_id: string | null;
          created_at: string | null;
          department_id: string | null;
          employee_id: string | null;
          employment_status: string | null;
          employment_type_id: string | null;
          end_date: string | null;
          hire_date: string;
          id: string;
          is_active: boolean | null;
          is_remote: boolean | null;
          metadata: Json | null;
          notes: string | null;
          pay_frequency: string | null;
          performance_rating: number | null;
          position_title: string;
          profile_id: string;
          reporting_manager_id: string | null;
          salary_amount: number | null;
          salary_currency: string | null;
          sick_days_allocated: number | null;
          sick_days_used: number | null;
          start_date: string;
          termination_date: string | null;
          termination_reason: string | null;
          updated_at: string | null;
          vacation_days_allocated: number | null;
          vacation_days_used: number | null;
          work_location: string | null;
          work_schedule: string | null;
        };
        Insert: {
          candidate_id?: string | null;
          contract_offer_id?: string | null;
          created_at?: string | null;
          department_id?: string | null;
          employee_id?: string | null;
          employment_status?: string | null;
          employment_type_id?: string | null;
          end_date?: string | null;
          hire_date: string;
          id?: string;
          is_active?: boolean | null;
          is_remote?: boolean | null;
          metadata?: Json | null;
          notes?: string | null;
          pay_frequency?: string | null;
          performance_rating?: number | null;
          position_title: string;
          profile_id: string;
          reporting_manager_id?: string | null;
          salary_amount?: number | null;
          salary_currency?: string | null;
          sick_days_allocated?: number | null;
          sick_days_used?: number | null;
          start_date: string;
          termination_date?: string | null;
          termination_reason?: string | null;
          updated_at?: string | null;
          vacation_days_allocated?: number | null;
          vacation_days_used?: number | null;
          work_location?: string | null;
          work_schedule?: string | null;
        };
        Update: {
          candidate_id?: string | null;
          contract_offer_id?: string | null;
          created_at?: string | null;
          department_id?: string | null;
          employee_id?: string | null;
          employment_status?: string | null;
          employment_type_id?: string | null;
          end_date?: string | null;
          hire_date?: string;
          id?: string;
          is_active?: boolean | null;
          is_remote?: boolean | null;
          metadata?: Json | null;
          notes?: string | null;
          pay_frequency?: string | null;
          performance_rating?: number | null;
          position_title?: string;
          profile_id?: string;
          reporting_manager_id?: string | null;
          salary_amount?: number | null;
          salary_currency?: string | null;
          sick_days_allocated?: number | null;
          sick_days_used?: number | null;
          start_date?: string;
          termination_date?: string | null;
          termination_reason?: string | null;
          updated_at?: string | null;
          vacation_days_allocated?: number | null;
          vacation_days_used?: number | null;
          work_location?: string | null;
          work_schedule?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'employment_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'employment_contract_offer_id_fkey';
            columns: ['contract_offer_id'];
            isOneToOne: false;
            referencedRelation: 'contract_offers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'employment_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_reporting_manager_id_fkey';
            columns: ['reporting_manager_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'employment_reporting_manager_id_fkey';
            columns: ['reporting_manager_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_reporting_manager_id_fkey';
            columns: ['reporting_manager_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      employment_types: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'employment_types_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_types_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'employment_types_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'employment_types_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'employment_types_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'employment_types_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'employment_types_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
        ];
      };
      evaluation_analytics: {
        Row: {
          avg_overall_score: number | null;
          avg_radar_metrics: Json;
          avg_team_rating: number | null;
          created_at: string | null;
          id: string;
          job_id: string;
          last_calculated_at: string | null;
          profile_id: string;
          recommendation_distribution: Json;
          score_distribution: Json;
          total_ai_evaluations: number | null;
          total_candidates: number | null;
          total_team_assessments: number | null;
          updated_at: string | null;
        };
        Insert: {
          avg_overall_score?: number | null;
          avg_radar_metrics?: Json;
          avg_team_rating?: number | null;
          created_at?: string | null;
          id?: string;
          job_id: string;
          last_calculated_at?: string | null;
          profile_id: string;
          recommendation_distribution?: Json;
          score_distribution?: Json;
          total_ai_evaluations?: number | null;
          total_candidates?: number | null;
          total_team_assessments?: number | null;
          updated_at?: string | null;
        };
        Update: {
          avg_overall_score?: number | null;
          avg_radar_metrics?: Json;
          avg_team_rating?: number | null;
          created_at?: string | null;
          id?: string;
          job_id?: string;
          last_calculated_at?: string | null;
          profile_id?: string;
          recommendation_distribution?: Json;
          score_distribution?: Json;
          total_ai_evaluations?: number | null;
          total_candidates?: number | null;
          total_team_assessments?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'evaluation_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'accessible_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_analytics_summary';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'user_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      evaluations: {
        Row: {
          candidate_id: string | null;
          created_at: string | null;
          evaluation_type: string | null;
          feedback: string | null;
          id: string;
          job_id: string | null;
          profile_id: string | null;
          recommendation: string | null;
          red_flags: Json | null;
          resume_filename: string | null;
          resume_score: number | null;
          resume_summary: string | null;
          score: number | null;
          skills_assessment: Json | null;
          strengths: Json | null;
          summary: string | null;
          traits_assessment: Json | null;
          updated_at: string | null;
        };
        Insert: {
          candidate_id?: string | null;
          created_at?: string | null;
          evaluation_type?: string | null;
          feedback?: string | null;
          id?: string;
          job_id?: string | null;
          profile_id?: string | null;
          recommendation?: string | null;
          red_flags?: Json | null;
          resume_filename?: string | null;
          resume_score?: number | null;
          resume_summary?: string | null;
          score?: number | null;
          skills_assessment?: Json | null;
          strengths?: Json | null;
          summary?: string | null;
          traits_assessment?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          candidate_id?: string | null;
          created_at?: string | null;
          evaluation_type?: string | null;
          feedback?: string | null;
          id?: string;
          job_id?: string | null;
          profile_id?: string | null;
          recommendation?: string | null;
          red_flags?: Json | null;
          resume_filename?: string | null;
          resume_score?: number | null;
          resume_summary?: string | null;
          score?: number | null;
          skills_assessment?: Json | null;
          strengths?: Json | null;
          summary?: string | null;
          traits_assessment?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'evaluations_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluations_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluations_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'evaluations_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'evaluations_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluations_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      function_logs: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          execution_time_ms: number | null;
          function_name: string;
          id: string;
          payload: Json | null;
          response: Json | null;
          status: string | null;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          function_name: string;
          id?: string;
          payload?: Json | null;
          response?: Json | null;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          function_name?: string;
          id?: string;
          payload?: Json | null;
          response?: Json | null;
          status?: string | null;
        };
        Relationships: [];
      };
      integrations: {
        Row: {
          access_token: string | null;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          profile_id: string;
          provider: string;
          refresh_token: string | null;
          scope: string | null;
          updated_at: string | null;
        };
        Insert: {
          access_token?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          profile_id: string;
          provider: string;
          refresh_token?: string | null;
          scope?: string | null;
          updated_at?: string | null;
        };
        Update: {
          access_token?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          profile_id?: string;
          provider?: string;
          refresh_token?: string | null;
          scope?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'integrations_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'integrations_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'integrations_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      interviews: {
        Row: {
          application_id: string;
          calendar_event_id: string | null;
          created_at: string | null;
          date: string;
          duration: number;
          id: string;
          job_id: string;
          meet_link: string | null;
          notes: string | null;
          reminder_sent_at: string | null;
          status: string | null;
          time: string;
          timezone_id: string | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          application_id: string;
          calendar_event_id?: string | null;
          created_at?: string | null;
          date: string;
          duration?: number;
          id?: string;
          job_id: string;
          meet_link?: string | null;
          notes?: string | null;
          reminder_sent_at?: string | null;
          status?: string | null;
          time: string;
          timezone_id?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          application_id?: string;
          calendar_event_id?: string | null;
          created_at?: string | null;
          date?: string;
          duration?: number;
          id?: string;
          job_id?: string;
          meet_link?: string | null;
          notes?: string | null;
          reminder_sent_at?: string | null;
          status?: string | null;
          time?: string;
          timezone_id?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'interviews_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interviews_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interviews_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'interviews_timezone_id_fkey';
            columns: ['timezone_id'];
            isOneToOne: false;
            referencedRelation: 'timezones';
            referencedColumns: ['id'];
          },
        ];
      };
      invites: {
        Row: {
          company_id: string;
          created_at: string | null;
          email: string;
          expires_at: string | null;
          first_name: string | null;
          id: string;
          invited_by: string;
          last_name: string | null;
          role: string;
          status: string;
          token: string | null;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          email: string;
          expires_at?: string | null;
          first_name?: string | null;
          id?: string;
          invited_by: string;
          last_name?: string | null;
          role?: string;
          status?: string;
          token?: string | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          email?: string;
          expires_at?: string | null;
          first_name?: string | null;
          id?: string;
          invited_by?: string;
          last_name?: string | null;
          role?: string;
          status?: string;
          token?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invites_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invites_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'invites_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'invites_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'invites_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'invites_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'invites_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'invites_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'invites_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invites_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      job_permissions: {
        Row: {
          created_at: string | null;
          granted_at: string | null;
          granted_by: string | null;
          id: string;
          job_id: string;
          permission_level: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          job_id: string;
          permission_level: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          job_id?: string;
          permission_level?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'job_permissions_granted_by_fkey';
            columns: ['granted_by'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'job_permissions_granted_by_fkey';
            columns: ['granted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_granted_by_fkey';
            columns: ['granted_by'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'accessible_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_analytics_summary';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'user_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'job_permissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      job_questions: {
        Row: {
          category: string;
          created_at: string | null;
          expected_duration: number | null;
          id: string;
          is_ai_generated: boolean | null;
          is_required: boolean | null;
          job_id: string;
          metadata: Json | null;
          order_index: number;
          question_text: string;
          question_type: string;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          expected_duration?: number | null;
          id?: string;
          is_ai_generated?: boolean | null;
          is_required?: boolean | null;
          job_id: string;
          metadata?: Json | null;
          order_index: number;
          question_text: string;
          question_type: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          expected_duration?: number | null;
          id?: string;
          is_ai_generated?: boolean | null;
          is_required?: boolean | null;
          job_id?: string;
          metadata?: Json | null;
          order_index?: number;
          question_text?: string;
          question_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'accessible_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_analytics_summary';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'user_jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      job_templates: {
        Row: {
          created_at: string | null;
          description: string | null;
          fields: Json | null;
          id: string;
          interview_format: string | null;
          is_active: boolean | null;
          is_public: boolean | null;
          name: string;
          profile_id: string | null;
          requirements: string | null;
          template_data: Json | null;
          title: string | null;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          fields?: Json | null;
          id?: string;
          interview_format?: string | null;
          is_active?: boolean | null;
          is_public?: boolean | null;
          name: string;
          profile_id?: string | null;
          requirements?: string | null;
          template_data?: Json | null;
          title?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          fields?: Json | null;
          id?: string;
          interview_format?: string | null;
          is_active?: boolean | null;
          is_public?: boolean | null;
          name?: string;
          profile_id?: string | null;
          requirements?: string | null;
          template_data?: Json | null;
          title?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'job_templates_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'job_templates_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_templates_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_templates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'job_templates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_templates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      job_titles: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'job_titles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_titles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'job_titles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'job_titles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'job_titles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'job_titles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'job_titles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
        ];
      };
      jobs: {
        Row: {
          created_at: string | null;
          department_id: string | null;
          description: string | null;
          employment_type: string | null;
          employment_type_id: string | null;
          fields: Json | null;
          id: string;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          job_title_id: string | null;
          job_type: Database['public']['Enums']['job_type'] | null;
          location: string | null;
          profile_id: string;
          requirements: string | null;
          salary_currency: string | null;
          salary_max: number | null;
          salary_min: number | null;
          salary_period: string | null;
          salary_range: string | null;
          settings: Json | null;
          status: string | null;
          title: string;
          updated_at: string | null;
          workplace_type: Database['public']['Enums']['workplace_type'] | null;
        };
        Insert: {
          created_at?: string | null;
          department_id?: string | null;
          description?: string | null;
          employment_type?: string | null;
          employment_type_id?: string | null;
          fields?: Json | null;
          id?: string;
          interview_format?: string | null;
          interview_token?: string | null;
          is_active?: boolean | null;
          job_title_id?: string | null;
          job_type?: Database['public']['Enums']['job_type'] | null;
          location?: string | null;
          profile_id: string;
          requirements?: string | null;
          salary_currency?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_period?: string | null;
          salary_range?: string | null;
          settings?: Json | null;
          status?: string | null;
          title: string;
          updated_at?: string | null;
          workplace_type?: Database['public']['Enums']['workplace_type'] | null;
        };
        Update: {
          created_at?: string | null;
          department_id?: string | null;
          description?: string | null;
          employment_type?: string | null;
          employment_type_id?: string | null;
          fields?: Json | null;
          id?: string;
          interview_format?: string | null;
          interview_token?: string | null;
          is_active?: boolean | null;
          job_title_id?: string | null;
          job_type?: Database['public']['Enums']['job_type'] | null;
          location?: string | null;
          profile_id?: string;
          requirements?: string | null;
          salary_currency?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_period?: string | null;
          salary_range?: string | null;
          settings?: Json | null;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
          workplace_type?: Database['public']['Enums']['workplace_type'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_employment_type_id_fkey';
            columns: ['employment_type_id'];
            isOneToOne: false;
            referencedRelation: 'employment_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_job_title_id_fkey';
            columns: ['job_title_id'];
            isOneToOne: false;
            referencedRelation: 'job_titles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      message_reactions: {
        Row: {
          created_at: string | null;
          emoji: string;
          id: string;
          message_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          emoji: string;
          id?: string;
          message_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          emoji?: string;
          id?: string;
          message_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'message_reactions_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_reactions_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_reactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'message_reactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_reactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      message_read_status: {
        Row: {
          id: string;
          message_id: string;
          read_at: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          read_at?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          read_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'message_read_status_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_read_status_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_read_status_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'message_read_status_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_read_status_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          attachment_name: string | null;
          attachment_size: number | null;
          attachment_type: string | null;
          attachment_url: string | null;
          created_at: string | null;
          edited_at: string | null;
          id: string;
          job_id: string;
          message_type: string | null;
          reply_to_id: string | null;
          status: string | null;
          text: string;
          thread_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          attachment_name?: string | null;
          attachment_size?: number | null;
          attachment_type?: string | null;
          attachment_url?: string | null;
          created_at?: string | null;
          edited_at?: string | null;
          id?: string;
          job_id: string;
          message_type?: string | null;
          reply_to_id?: string | null;
          status?: string | null;
          text: string;
          thread_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          attachment_name?: string | null;
          attachment_size?: number | null;
          attachment_type?: string | null;
          attachment_url?: string | null;
          created_at?: string | null;
          edited_at?: string | null;
          id?: string;
          job_id?: string;
          message_type?: string | null;
          reply_to_id?: string | null;
          status?: string | null;
          text?: string;
          thread_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_reply_to_id_fkey';
            columns: ['reply_to_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_reply_to_id_fkey';
            columns: ['reply_to_id'];
            isOneToOne: false;
            referencedRelation: 'messages_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_thread_id_fkey';
            columns: ['thread_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_thread_id_fkey';
            columns: ['thread_id'];
            isOneToOne: false;
            referencedRelation: 'messages_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          application_updates: boolean | null;
          created_at: string | null;
          email_notifications: boolean | null;
          id: string;
          interview_reminders: boolean | null;
          profile_id: string;
          push_notifications: boolean | null;
          system_updates: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          application_updates?: boolean | null;
          created_at?: string | null;
          email_notifications?: boolean | null;
          id?: string;
          interview_reminders?: boolean | null;
          profile_id: string;
          push_notifications?: boolean | null;
          system_updates?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          application_updates?: boolean | null;
          created_at?: string | null;
          email_notifications?: boolean | null;
          id?: string;
          interview_reminders?: boolean | null;
          profile_id?: string;
          push_notifications?: boolean | null;
          system_updates?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'notification_preferences_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_preferences_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          action_text: string | null;
          action_url: string | null;
          category: string | null;
          company_id: string;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          is_read: boolean | null;
          message: string;
          metadata: Json | null;
          read_at: string | null;
          related_entity_id: string | null;
          related_entity_type: string | null;
          title: string;
          type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          action_text?: string | null;
          action_url?: string | null;
          category?: string | null;
          company_id: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          metadata?: Json | null;
          read_at?: string | null;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          title: string;
          type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          action_text?: string | null;
          action_url?: string | null;
          category?: string | null;
          company_id?: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          metadata?: Json | null;
          read_at?: string | null;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          title?: string;
          type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'notifications_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'notifications_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'notifications_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'notifications_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'notifications_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      payroll: {
        Row: {
          base_salary: number | null;
          bonus: number | null;
          commission: number | null;
          created_at: string | null;
          currency: string | null;
          employment_id: string;
          gross_pay: number | null;
          id: string;
          insurance_deductions: number | null;
          metadata: Json | null;
          net_pay: number | null;
          other_deductions: number | null;
          other_earnings: number | null;
          overtime_pay: number | null;
          pay_date: string;
          pay_period_end: string;
          pay_period_start: string;
          payment_method: string | null;
          payment_reference: string | null;
          retirement_deductions: number | null;
          status: string | null;
          tax_deductions: number | null;
          total_deductions: number | null;
          updated_at: string | null;
        };
        Insert: {
          base_salary?: number | null;
          bonus?: number | null;
          commission?: number | null;
          created_at?: string | null;
          currency?: string | null;
          employment_id: string;
          gross_pay?: number | null;
          id?: string;
          insurance_deductions?: number | null;
          metadata?: Json | null;
          net_pay?: number | null;
          other_deductions?: number | null;
          other_earnings?: number | null;
          overtime_pay?: number | null;
          pay_date: string;
          pay_period_end: string;
          pay_period_start: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          retirement_deductions?: number | null;
          status?: string | null;
          tax_deductions?: number | null;
          total_deductions?: number | null;
          updated_at?: string | null;
        };
        Update: {
          base_salary?: number | null;
          bonus?: number | null;
          commission?: number | null;
          created_at?: string | null;
          currency?: string | null;
          employment_id?: string;
          gross_pay?: number | null;
          id?: string;
          insurance_deductions?: number | null;
          metadata?: Json | null;
          net_pay?: number | null;
          other_deductions?: number | null;
          other_earnings?: number | null;
          overtime_pay?: number | null;
          pay_date?: string;
          pay_period_end?: string;
          pay_period_start?: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          retirement_deductions?: number | null;
          status?: string | null;
          tax_deductions?: number | null;
          total_deductions?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payroll_employment_id_fkey';
            columns: ['employment_id'];
            isOneToOne: false;
            referencedRelation: 'employment';
            referencedColumns: ['id'];
          },
        ];
      };
      performance_reviews: {
        Row: {
          acknowledged_at: string | null;
          areas_for_improvement: string | null;
          communication_rating: number | null;
          completed_at: string | null;
          created_at: string | null;
          employee_comments: string | null;
          employment_id: string;
          goals_achievement_rating: number | null;
          goals_for_next_period: string | null;
          id: string;
          metadata: Json | null;
          overall_rating: number | null;
          review_period_end: string;
          review_period_start: string;
          review_type: string | null;
          reviewer_comments: string | null;
          reviewer_id: string;
          skills_rating: number | null;
          status: string | null;
          strengths: string | null;
          teamwork_rating: number | null;
          updated_at: string | null;
        };
        Insert: {
          acknowledged_at?: string | null;
          areas_for_improvement?: string | null;
          communication_rating?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          employee_comments?: string | null;
          employment_id: string;
          goals_achievement_rating?: number | null;
          goals_for_next_period?: string | null;
          id?: string;
          metadata?: Json | null;
          overall_rating?: number | null;
          review_period_end: string;
          review_period_start: string;
          review_type?: string | null;
          reviewer_comments?: string | null;
          reviewer_id: string;
          skills_rating?: number | null;
          status?: string | null;
          strengths?: string | null;
          teamwork_rating?: number | null;
          updated_at?: string | null;
        };
        Update: {
          acknowledged_at?: string | null;
          areas_for_improvement?: string | null;
          communication_rating?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          employee_comments?: string | null;
          employment_id?: string;
          goals_achievement_rating?: number | null;
          goals_for_next_period?: string | null;
          id?: string;
          metadata?: Json | null;
          overall_rating?: number | null;
          review_period_end?: string;
          review_period_start?: string;
          review_type?: string | null;
          reviewer_comments?: string | null;
          reviewer_id?: string;
          skills_rating?: number | null;
          status?: string | null;
          strengths?: string | null;
          teamwork_rating?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'performance_reviews_employment_id_fkey';
            columns: ['employment_id'];
            isOneToOne: false;
            referencedRelation: 'employment';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'performance_reviews_reviewer_id_fkey';
            columns: ['reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'performance_reviews_reviewer_id_fkey';
            columns: ['reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'performance_reviews_reviewer_id_fkey';
            columns: ['reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          company_id: string | null;
          created_at: string | null;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          email: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
        ];
      };
      realtime_test: {
        Row: {
          created_at: string | null;
          id: string;
          message: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message?: string;
        };
        Relationships: [];
      };
      responses: {
        Row: {
          answer: string;
          candidate_id: string;
          created_at: string | null;
          id: string;
          job_question_id: string | null;
          question_id: string;
          response_time: number | null;
          resume_text: string | null;
        };
        Insert: {
          answer: string;
          candidate_id: string;
          created_at?: string | null;
          id?: string;
          job_question_id?: string | null;
          question_id: string;
          response_time?: number | null;
          resume_text?: string | null;
        };
        Update: {
          answer?: string;
          candidate_id?: string;
          created_at?: string | null;
          id?: string;
          job_question_id?: string | null;
          question_id?: string;
          response_time?: number | null;
          resume_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'responses_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'responses_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'responses_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'responses_job_question_id_fkey';
            columns: ['job_question_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'responses_job_question_id_fkey';
            columns: ['job_question_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_detailed';
            referencedColumns: ['id'];
          },
        ];
      };
      service_config: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_encrypted: boolean | null;
          key: string;
          updated_at: string | null;
          value: Json;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_encrypted?: boolean | null;
          key: string;
          updated_at?: string | null;
          value: Json;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_encrypted?: boolean | null;
          key?: string;
          updated_at?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          category_id: string | null;
          company_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          profile_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          profile_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          profile_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'skills_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'skills_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'skills_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'skills_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          created_at: string | null;
          description: string | null;
          features: Json | null;
          id: string;
          interval: string | null;
          is_active: boolean | null;
          limits: Json | null;
          max_interviews_per_month: number | null;
          max_jobs: number | null;
          name: string;
          price_monthly: number | null;
          price_yearly: number | null;
          stripe_checkout_link_dev: string | null;
          stripe_checkout_link_dev_yearly: string | null;
          stripe_checkout_link_prod: string | null;
          stripe_checkout_link_prod_yearly: string | null;
          stripe_price_id: string | null;
          stripe_price_id_dev: string | null;
          stripe_price_id_dev_yearly: string | null;
          stripe_price_id_prod: string | null;
          stripe_price_id_prod_yearly: string | null;
          stripe_product_id: string | null;
          trial_days: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          features?: Json | null;
          id?: string;
          interval?: string | null;
          is_active?: boolean | null;
          limits?: Json | null;
          max_interviews_per_month?: number | null;
          max_jobs?: number | null;
          name: string;
          price_monthly?: number | null;
          price_yearly?: number | null;
          stripe_checkout_link_dev?: string | null;
          stripe_checkout_link_dev_yearly?: string | null;
          stripe_checkout_link_prod?: string | null;
          stripe_checkout_link_prod_yearly?: string | null;
          stripe_price_id?: string | null;
          stripe_price_id_dev?: string | null;
          stripe_price_id_dev_yearly?: string | null;
          stripe_price_id_prod?: string | null;
          stripe_price_id_prod_yearly?: string | null;
          stripe_product_id?: string | null;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          features?: Json | null;
          id?: string;
          interval?: string | null;
          is_active?: boolean | null;
          limits?: Json | null;
          max_interviews_per_month?: number | null;
          max_jobs?: number | null;
          name?: string;
          price_monthly?: number | null;
          price_yearly?: number | null;
          stripe_checkout_link_dev?: string | null;
          stripe_checkout_link_dev_yearly?: string | null;
          stripe_checkout_link_prod?: string | null;
          stripe_checkout_link_prod_yearly?: string | null;
          stripe_price_id?: string | null;
          stripe_price_id_dev?: string | null;
          stripe_price_id_dev_yearly?: string | null;
          stripe_price_id_prod?: string | null;
          stripe_price_id_prod_yearly?: string | null;
          stripe_product_id?: string | null;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      team_assessments: {
        Row: {
          ai_evaluation_id: string | null;
          assessment_comments: string | null;
          assessment_type: string;
          assessor_name: string;
          assessor_profile_id: string;
          assessor_role: string;
          candidate_id: string;
          category_ratings: Json;
          created_at: string | null;
          id: string;
          interview_duration_minutes: number | null;
          job_id: string;
          overall_rating: number;
          overall_rating_status: string;
          private_notes: string | null;
          updated_at: string | null;
        };
        Insert: {
          ai_evaluation_id?: string | null;
          assessment_comments?: string | null;
          assessment_type: string;
          assessor_name: string;
          assessor_profile_id: string;
          assessor_role: string;
          candidate_id: string;
          category_ratings?: Json;
          created_at?: string | null;
          id?: string;
          interview_duration_minutes?: number | null;
          job_id: string;
          overall_rating: number;
          overall_rating_status: string;
          private_notes?: string | null;
          updated_at?: string | null;
        };
        Update: {
          ai_evaluation_id?: string | null;
          assessment_comments?: string | null;
          assessment_type?: string;
          assessor_name?: string;
          assessor_profile_id?: string;
          assessor_role?: string;
          candidate_id?: string;
          category_ratings?: Json;
          created_at?: string | null;
          id?: string;
          interview_duration_minutes?: number | null;
          job_id?: string;
          overall_rating?: number;
          overall_rating_status?: string;
          private_notes?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'team_assessments_ai_evaluation_id_fkey';
            columns: ['ai_evaluation_id'];
            isOneToOne: false;
            referencedRelation: 'ai_evaluations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_assessments_assessor_profile_id_fkey';
            columns: ['assessor_profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'team_assessments_assessor_profile_id_fkey';
            columns: ['assessor_profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_assessments_assessor_profile_id_fkey';
            columns: ['assessor_profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_assessments_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_assessments_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_assessments_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'team_assessments_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'accessible_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_assessments_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_analytics_summary';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'team_assessments_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_assessments_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'team_assessments_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'team_assessments_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_assessments_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_assessments_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_assessments_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'user_jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      team_responses: {
        Row: {
          candidate_id: string;
          communication_rating: number | null;
          created_at: string | null;
          cultural_fit_rating: number | null;
          evaluator_id: string;
          feedback: string | null;
          id: string;
          overall_rating: number | null;
          recommendation: string | null;
          technical_skills_rating: number | null;
          updated_at: string | null;
        };
        Insert: {
          candidate_id: string;
          communication_rating?: number | null;
          created_at?: string | null;
          cultural_fit_rating?: number | null;
          evaluator_id: string;
          feedback?: string | null;
          id?: string;
          overall_rating?: number | null;
          recommendation?: string | null;
          technical_skills_rating?: number | null;
          updated_at?: string | null;
        };
        Update: {
          candidate_id?: string;
          communication_rating?: number | null;
          created_at?: string | null;
          cultural_fit_rating?: number | null;
          evaluator_id?: string;
          feedback?: string | null;
          id?: string;
          overall_rating?: number | null;
          recommendation?: string | null;
          technical_skills_rating?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'team_responses_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_responses_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_responses_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'team_responses_evaluator_id_fkey';
            columns: ['evaluator_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'team_responses_evaluator_id_fkey';
            columns: ['evaluator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_responses_evaluator_id_fkey';
            columns: ['evaluator_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      time_tracking: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          break_end_time: string | null;
          break_hours: number | null;
          break_start_time: string | null;
          clock_in_time: string | null;
          clock_out_time: string | null;
          created_at: string | null;
          date: string;
          employment_id: string;
          id: string;
          metadata: Json | null;
          notes: string | null;
          overtime_hours: number | null;
          regular_hours: number | null;
          status: string | null;
          total_hours: number | null;
          updated_at: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          break_end_time?: string | null;
          break_hours?: number | null;
          break_start_time?: string | null;
          clock_in_time?: string | null;
          clock_out_time?: string | null;
          created_at?: string | null;
          date: string;
          employment_id: string;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          overtime_hours?: number | null;
          regular_hours?: number | null;
          status?: string | null;
          total_hours?: number | null;
          updated_at?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          break_end_time?: string | null;
          break_hours?: number | null;
          break_start_time?: string | null;
          clock_in_time?: string | null;
          clock_out_time?: string | null;
          created_at?: string | null;
          date?: string;
          employment_id?: string;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          overtime_hours?: number | null;
          regular_hours?: number | null;
          status?: string | null;
          total_hours?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'time_tracking_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'time_tracking_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'time_tracking_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'time_tracking_employment_id_fkey';
            columns: ['employment_id'];
            isOneToOne: false;
            referencedRelation: 'employment';
            referencedColumns: ['id'];
          },
        ];
      };
      timezones: {
        Row: {
          city: string | null;
          country_id: string | null;
          created_at: string | null;
          display_name: string;
          id: string;
          is_dst: boolean;
          name: string;
          offset_hours: number;
          offset_minutes: number;
          region: string;
        };
        Insert: {
          city?: string | null;
          country_id?: string | null;
          created_at?: string | null;
          display_name: string;
          id?: string;
          is_dst?: boolean;
          name: string;
          offset_hours: number;
          offset_minutes?: number;
          region: string;
        };
        Update: {
          city?: string | null;
          country_id?: string | null;
          created_at?: string | null;
          display_name?: string;
          id?: string;
          is_dst?: boolean;
          name?: string;
          offset_hours?: number;
          offset_minutes?: number;
          region?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'timezones_country_id_fkey';
            columns: ['country_id'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['id'];
          },
        ];
      };
      traits: {
        Row: {
          category_id: string | null;
          company_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          profile_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          profile_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          profile_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'traits_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'traits_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'traits_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'traits_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activities: {
        Row: {
          activity_type: string;
          company_id: string | null;
          created_at: string | null;
          description: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          metadata: Json | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          activity_type: string;
          company_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          activity_type?: string;
          company_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activities_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'user_activities_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'user_activities_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'user_activities_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'user_activities_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'user_activities_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'user_activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'user_activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          expires_at: string | null;
          id: string;
          profile_id: string;
          started_at: string | null;
          status: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_id: string;
          trial_end: string | null;
          trial_start: string | null;
          updated_at: string | null;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          expires_at?: string | null;
          id?: string;
          profile_id: string;
          started_at?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_id: string;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          expires_at?: string | null;
          id?: string;
          profile_id?: string;
          started_at?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_id?: string;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_subscriptions_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'user_subscriptions_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_subscriptions_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_subscriptions_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_subscriptions_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['subscription_id'];
          },
        ];
      };
      webhook_logs: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          event_data: Json;
          event_type: string;
          id: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          event_data?: Json;
          event_type: string;
          id?: string;
          status: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          event_data?: Json;
          event_type?: string;
          id?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      accessible_jobs: {
        Row: {
          created_at: string | null;
          department_id: string | null;
          description: string | null;
          employment_type: string | null;
          employment_type_id: string | null;
          fields: Json | null;
          id: string | null;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          job_title_id: string | null;
          job_type: Database['public']['Enums']['job_type'] | null;
          location: string | null;
          profile_id: string | null;
          requirements: string | null;
          salary_currency: string | null;
          salary_max: number | null;
          salary_min: number | null;
          salary_period: string | null;
          salary_range: string | null;
          settings: Json | null;
          status: string | null;
          title: string | null;
          updated_at: string | null;
          workplace_type: Database['public']['Enums']['workplace_type'] | null;
        };
        Insert: {
          created_at?: string | null;
          department_id?: string | null;
          description?: string | null;
          employment_type?: string | null;
          employment_type_id?: string | null;
          fields?: Json | null;
          id?: string | null;
          interview_format?: string | null;
          interview_token?: string | null;
          is_active?: boolean | null;
          job_title_id?: string | null;
          job_type?: Database['public']['Enums']['job_type'] | null;
          location?: string | null;
          profile_id?: string | null;
          requirements?: string | null;
          salary_currency?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_period?: string | null;
          salary_range?: string | null;
          settings?: Json | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
          workplace_type?: Database['public']['Enums']['workplace_type'] | null;
        };
        Update: {
          created_at?: string | null;
          department_id?: string | null;
          description?: string | null;
          employment_type?: string | null;
          employment_type_id?: string | null;
          fields?: Json | null;
          id?: string | null;
          interview_format?: string | null;
          interview_token?: string | null;
          is_active?: boolean | null;
          job_title_id?: string | null;
          job_type?: Database['public']['Enums']['job_type'] | null;
          location?: string | null;
          profile_id?: string | null;
          requirements?: string | null;
          salary_currency?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_period?: string | null;
          salary_range?: string | null;
          settings?: Json | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
          workplace_type?: Database['public']['Enums']['workplace_type'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_employment_type_id_fkey';
            columns: ['employment_type_id'];
            isOneToOne: false;
            referencedRelation: 'employment_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_job_title_id_fkey';
            columns: ['job_title_id'];
            isOneToOne: false;
            referencedRelation: 'job_titles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_usage_analytics: {
        Row: {
          avg_tokens_per_request: number | null;
          capability: string | null;
          company_id: string | null;
          model_id: string | null;
          request_count: number | null;
          total_cost: number | null;
          total_tokens: number | null;
          usage_date: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'ai_model_usage_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
        ];
      };
      candidate_analytics_summary: {
        Row: {
          avg_resume_score: number | null;
          completed_applications: number | null;
          evaluated_candidates: number | null;
          failed_evaluations: number | null;
          job_id: string | null;
          job_title: string | null;
          profile_id: string | null;
          successful_evaluations: number | null;
          total_candidates: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      candidate_details: {
        Row: {
          candidate_info_id: string | null;
          created_at: string | null;
          current_step: number | null;
          email: string | null;
          evaluation_created_at: string | null;
          evaluation_id: string | null;
          evaluation_type: string | null;
          first_name: string | null;
          full_name: string | null;
          id: string | null;
          interview_token: string | null;
          is_completed: boolean | null;
          job_fields: Json | null;
          job_id: string | null;
          job_status: string | null;
          job_title: string | null;
          last_name: string | null;
          profile_id: string | null;
          progress_percentage: number | null;
          recommendation: string | null;
          red_flags: Json | null;
          response_count: number | null;
          resume_file_path: string | null;
          resume_file_size: number | null;
          resume_file_type: string | null;
          resume_filename: string | null;
          resume_id: string | null;
          resume_parsing_error: string | null;
          resume_parsing_status: string | null;
          resume_public_url: string | null;
          resume_score: number | null;
          resume_summary: string | null;
          resume_uploaded_at: string | null;
          resume_word_count: number | null;
          score: number | null;
          skills_assessment: Json | null;
          status: string | null;
          strengths: Json | null;
          submitted_at: string | null;
          summary: string | null;
          total_steps: number | null;
          traits_assessment: Json | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'candidates_candidate_info_id_fkey';
            columns: ['candidate_info_id'];
            isOneToOne: false;
            referencedRelation: 'candidates_info';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      company_candidate_pipeline: {
        Row: {
          company_id: string | null;
          count: number | null;
          name: string | null;
          status: string | null;
        };
        Relationships: [];
      };
      company_jobs: {
        Row: {
          candidate_count: number | null;
          company_name: string | null;
          company_slug: string | null;
          created_at: string | null;
          department_id: string | null;
          description: string | null;
          email: string | null;
          employment_type: string | null;
          employment_type_id: string | null;
          fields: Json | null;
          first_name: string | null;
          id: string | null;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          job_title_id: string | null;
          job_type: Database['public']['Enums']['job_type'] | null;
          last_name: string | null;
          location: string | null;
          profile_id: string | null;
          requirements: string | null;
          salary_currency: string | null;
          salary_max: number | null;
          salary_min: number | null;
          salary_period: string | null;
          salary_range: string | null;
          settings: Json | null;
          status: string | null;
          title: string | null;
          updated_at: string | null;
          workplace_type: Database['public']['Enums']['workplace_type'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_employment_type_id_fkey';
            columns: ['employment_type_id'];
            isOneToOne: false;
            referencedRelation: 'employment_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_job_title_id_fkey';
            columns: ['job_title_id'];
            isOneToOne: false;
            referencedRelation: 'job_titles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      company_upcoming_interviews: {
        Row: {
          calendar_event_id: string | null;
          candidate_email: string | null;
          candidate_first_name: string | null;
          candidate_id: string | null;
          candidate_last_name: string | null;
          company_id: string | null;
          company_name: string | null;
          interview_date: string | null;
          interview_id: string | null;
          interview_status: string | null;
          interview_time: string | null;
          job_id: string | null;
          job_title: string | null;
          meet_link: string | null;
        };
        Relationships: [];
      };
      interview_details: {
        Row: {
          application_id: string | null;
          calendar_event_id: string | null;
          candidate_email: string | null;
          candidate_first_name: string | null;
          candidate_last_name: string | null;
          candidate_name: string | null;
          company_id: string | null;
          company_name: string | null;
          created_at: string | null;
          duration: number | null;
          event_summary: string | null;
          interview_date: string | null;
          interview_id: string | null;
          interview_status: string | null;
          interview_time: string | null;
          job_id: string | null;
          job_owner_id: string | null;
          job_title: string | null;
          meet_link: string | null;
          notes: string | null;
          organizer_info: Json | null;
          reminder_sent_at: string | null;
          timezone_id: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'interviews_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interviews_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interviews_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'interviews_timezone_id_fkey';
            columns: ['timezone_id'];
            isOneToOne: false;
            referencedRelation: 'timezones';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['job_owner_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['job_owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['job_owner_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      interview_sessions: {
        Row: {
          candidate_id: string | null;
          completion_percentage: number | null;
          email: string | null;
          first_name: string | null;
          interview_token: string | null;
          is_completed: boolean | null;
          job_id: string | null;
          job_title: string | null;
          last_name: string | null;
          last_response_at: string | null;
          started_at: string | null;
          total_questions: number | null;
          total_responses: number | null;
          total_time_spent: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'responses_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'responses_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'responses_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['candidate_id'];
          },
        ];
      };
      job_permissions_detailed: {
        Row: {
          created_at: string | null;
          email: string | null;
          first_name: string | null;
          granted_at: string | null;
          granted_by_first_name: string | null;
          granted_by_last_name: string | null;
          id: string | null;
          job_id: string | null;
          job_owner_id: string | null;
          job_title: string | null;
          last_name: string | null;
          permission_level: string | null;
          updated_at: string | null;
          user_id: string | null;
          user_role: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'accessible_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_analytics_summary';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'user_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'job_permissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['job_owner_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['job_owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['job_owner_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      job_questions_detailed: {
        Row: {
          category: string | null;
          expected_duration: number | null;
          id: string | null;
          interview_format: string | null;
          is_ai_generated: boolean | null;
          is_required: boolean | null;
          job_id: string | null;
          job_is_active: boolean | null;
          job_status: string | null;
          job_title: string | null;
          metadata: Json | null;
          order_index: number | null;
          profile_id: string | null;
          question_created_at: string | null;
          question_text: string | null;
          question_type: string | null;
          question_updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'accessible_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_analytics_summary';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_questions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'user_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      job_questions_overview: {
        Row: {
          average_score: number | null;
          company_id: string | null;
          company_name: string | null;
          company_slug: string | null;
          completed_interviews: number | null;
          creator_email: string | null;
          creator_id: string | null;
          first_name: string | null;
          job_created_at: string | null;
          job_id: string | null;
          job_is_active: boolean | null;
          job_status: string | null;
          job_title: string | null;
          job_updated_at: string | null;
          last_name: string | null;
          required_questions: number | null;
          total_candidates: number | null;
          total_evaluations: number | null;
          total_questions: number | null;
        };
        Relationships: [];
      };
      job_templates_view: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          description: string | null;
          email: string | null;
          fields: Json | null;
          first_name: string | null;
          id: string | null;
          interview_format: string | null;
          is_active: boolean | null;
          is_public: boolean | null;
          last_name: string | null;
          name: string | null;
          profile_id: string | null;
          requirements: string | null;
          template_data: Json | null;
          title: string | null;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'job_templates_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'job_templates_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_templates_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_templates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'job_templates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_templates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
        ];
      };
      jobs_comprehensive: {
        Row: {
          average_score: number | null;
          candidate_count: number | null;
          company_id: string | null;
          company_name: string | null;
          company_slug: string | null;
          completed_interviews: number | null;
          created_at: string | null;
          creator_details: Json | null;
          department_id: string | null;
          department_name: string | null;
          description: string | null;
          employment_type: string | null;
          employment_type_id: string | null;
          employment_type_name: string | null;
          evaluation_count: number | null;
          fields: Json | null;
          id: string | null;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          job_title_id: string | null;
          job_title_name: string | null;
          job_type: Database['public']['Enums']['job_type'] | null;
          location: string | null;
          profile_id: string | null;
          requirements: string | null;
          response_count: number | null;
          salary_currency: string | null;
          salary_max: number | null;
          salary_min: number | null;
          salary_period: string | null;
          salary_range: string | null;
          settings: Json | null;
          status: string | null;
          title: string | null;
          updated_at: string | null;
          workplace_type: Database['public']['Enums']['workplace_type'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_employment_type_id_fkey';
            columns: ['employment_type_id'];
            isOneToOne: false;
            referencedRelation: 'employment_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_job_title_id_fkey';
            columns: ['job_title_id'];
            isOneToOne: false;
            referencedRelation: 'job_titles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      jobs_detailed: {
        Row: {
          candidate_count: number | null;
          company_name_full: string | null;
          company_slug: string | null;
          completed_interviews: number | null;
          created_at: string | null;
          department_id: string | null;
          department_name: string | null;
          description: string | null;
          email: string | null;
          employment_type: string | null;
          employment_type_id: string | null;
          employment_type_name: string | null;
          fields: Json | null;
          first_name: string | null;
          id: string | null;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          job_title_id: string | null;
          job_title_name: string | null;
          job_type: Database['public']['Enums']['job_type'] | null;
          last_name: string | null;
          location: string | null;
          profile_id: string | null;
          requirements: string | null;
          role: string | null;
          salary_currency: string | null;
          salary_max: number | null;
          salary_min: number | null;
          salary_period: string | null;
          salary_range: string | null;
          settings: Json | null;
          status: string | null;
          title: string | null;
          updated_at: string | null;
          workplace_type: Database['public']['Enums']['workplace_type'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_employment_type_id_fkey';
            columns: ['employment_type_id'];
            isOneToOne: false;
            referencedRelation: 'employment_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_job_title_id_fkey';
            columns: ['job_title_id'];
            isOneToOne: false;
            referencedRelation: 'job_titles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      messages_detailed: {
        Row: {
          attachment_name: string | null;
          attachment_size: number | null;
          attachment_type: string | null;
          attachment_url: string | null;
          created_at: string | null;
          edited_at: string | null;
          id: string | null;
          job_id: string | null;
          job_title: string | null;
          reply_to_id: string | null;
          reply_to_text: string | null;
          reply_to_user_first_name: string | null;
          reply_to_user_last_name: string | null;
          status: string | null;
          text: string | null;
          updated_at: string | null;
          user_email: string | null;
          user_first_name: string | null;
          user_id: string | null;
          user_last_name: string | null;
          user_role: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_reply_to_id_fkey';
            columns: ['reply_to_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_reply_to_id_fkey';
            columns: ['reply_to_id'];
            isOneToOne: false;
            referencedRelation: 'messages_detailed';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications_details: {
        Row: {
          action_text: string | null;
          action_url: string | null;
          company_id: string | null;
          entity_id: string | null;
          entity_type: string | null;
          expires_at: string | null;
          id: string | null;
          message: string | null;
          metadata: Json | null;
          notification_id: string | null;
          read: boolean | null;
          read_at: string | null;
          status: string | null;
          timestamp: string | null;
          title: string | null;
          type: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      skills_view: {
        Row: {
          category: string | null;
          category_description: string | null;
          category_sort_order: number | null;
          company_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string | null;
          is_active: boolean | null;
          name: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'skills_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
        ];
      };
      traits_view: {
        Row: {
          category: string | null;
          category_description: string | null;
          category_sort_order: number | null;
          company_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string | null;
          is_active: boolean | null;
          name: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'traits_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
        ];
      };
      user_details: {
        Row: {
          active_jobs_count: number | null;
          cancel_at_period_end: boolean | null;
          company_created_at: string | null;
          company_id: string | null;
          company_name: string | null;
          company_slug: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          email: string | null;
          first_name: string | null;
          id: string | null;
          interviews_this_month: number | null;
          last_name: string | null;
          max_interviews_per_month: number | null;
          max_jobs: number | null;
          price_monthly: number | null;
          price_yearly: number | null;
          role: string | null;
          stripe_checkout_link_dev: string | null;
          stripe_checkout_link_dev_yearly: string | null;
          stripe_checkout_link_prod: string | null;
          stripe_checkout_link_prod_yearly: string | null;
          stripe_customer_id: string | null;
          stripe_price_id_dev: string | null;
          stripe_price_id_dev_yearly: string | null;
          stripe_price_id_prod: string | null;
          stripe_price_id_prod_yearly: string | null;
          stripe_subscription_id: string | null;
          subscription_description: string | null;
          subscription_features: Json | null;
          subscription_id: string | null;
          subscription_name: string | null;
          subscription_started_at: string | null;
          subscription_status: string | null;
          subscription_updated_at: string | null;
          trial_end: string | null;
          trial_start: string | null;
          user_created_at: string | null;
          user_updated_at: string | null;
        };
        Relationships: [];
      };
      user_jobs: {
        Row: {
          candidate_count: number | null;
          company_name: string | null;
          company_slug: string | null;
          created_at: string | null;
          department_id: string | null;
          description: string | null;
          email: string | null;
          employment_type: string | null;
          employment_type_id: string | null;
          fields: Json | null;
          first_name: string | null;
          id: string | null;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          job_title_id: string | null;
          job_type: Database['public']['Enums']['job_type'] | null;
          last_name: string | null;
          location: string | null;
          profile_id: string | null;
          requirements: string | null;
          salary_currency: string | null;
          salary_max: number | null;
          salary_min: number | null;
          salary_period: string | null;
          salary_range: string | null;
          settings: Json | null;
          status: string | null;
          title: string | null;
          updated_at: string | null;
          workplace_type: Database['public']['Enums']['workplace_type'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_employment_type_id_fkey';
            columns: ['employment_type_id'];
            isOneToOne: false;
            referencedRelation: 'employment_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_job_title_id_fkey';
            columns: ['job_title_id'];
            isOneToOne: false;
            referencedRelation: 'job_titles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['creator_id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      calculate_candidate_score: {
        Args: { candidate_uuid: string };
        Returns: number;
      };
      check_job_access: {
        Args: { job_uuid: string; user_uuid: string };
        Returns: boolean;
      };
      check_realtime_config: {
        Args: Record<PropertyKey, never>;
        Returns: {
          table_name: string;
          in_publication: boolean;
          replica_identity: string;
          policy_count: number;
          has_anon_select: boolean;
          has_authenticated_select: boolean;
          has_service_role_select: boolean;
        }[];
      };
      check_subscription_limit: {
        Args: {
          p_profile_id: string;
          p_limit_type: string;
          p_current_count?: number;
        };
        Returns: boolean;
      };
      cleanup_expired_notifications: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      complete_candidate_application: {
        Args: { p_candidate_id: string };
        Returns: Json;
      };
      create_candidate_info_and_record: {
        Args: {
          p_first_name: string;
          p_last_name: string;
          p_email: string;
          p_job_id: string;
          p_interview_token: string;
        };
        Returns: Json;
      };
      generate_company_slug: {
        Args: { company_name: string };
        Returns: string;
      };
      get_candidate_by_interview_token: {
        Args: { p_interview_token: string };
        Returns: Json;
      };
      get_candidate_details: {
        Args: { p_interview_token: string };
        Returns: Json;
      };
      get_candidate_with_info: {
        Args: { p_candidate_id: string };
        Returns: Json;
      };
      get_dashboard_metrics: {
        Args: { p_company_id: string };
        Returns: Json;
      };
      get_job_candidate_details: {
        Args: {
          p_job_id: string;
          p_search?: string;
          p_status?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          candidate_info_id: string | null;
          created_at: string | null;
          current_step: number | null;
          email: string | null;
          evaluation_created_at: string | null;
          evaluation_id: string | null;
          evaluation_type: string | null;
          first_name: string | null;
          full_name: string | null;
          id: string | null;
          interview_token: string | null;
          is_completed: boolean | null;
          job_fields: Json | null;
          job_id: string | null;
          job_status: string | null;
          job_title: string | null;
          last_name: string | null;
          profile_id: string | null;
          progress_percentage: number | null;
          recommendation: string | null;
          red_flags: Json | null;
          response_count: number | null;
          resume_file_path: string | null;
          resume_file_size: number | null;
          resume_file_type: string | null;
          resume_filename: string | null;
          resume_id: string | null;
          resume_parsing_error: string | null;
          resume_parsing_status: string | null;
          resume_public_url: string | null;
          resume_score: number | null;
          resume_summary: string | null;
          resume_uploaded_at: string | null;
          resume_word_count: number | null;
          score: number | null;
          skills_assessment: Json | null;
          status: string | null;
          strengths: Json | null;
          submitted_at: string | null;
          summary: string | null;
          total_steps: number | null;
          traits_assessment: Json | null;
          updated_at: string | null;
        }[];
      };
      get_job_candidate_stats: {
        Args: { p_job_id: string; p_profile_id?: string };
        Returns: {
          total_candidates: number;
          completed_candidates: number;
          in_progress_candidates: number;
          pending_candidates: number;
          average_score: number;
        }[];
      };
      get_job_candidates: {
        Args: { p_job_id: string; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          job_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          status: string;
          created_at: string;
          updated_at: string;
          updated_by: string;
          candidate_info_id: string;
          resume_path: string;
          cover_letter: string;
          source: string;
          metadata: Json;
        }[];
      };
      get_job_company_info: {
        Args: { job_uuid: string };
        Returns: Json;
      };
      get_job_interviews: {
        Args: { p_job_id: string; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          job_id: string;
          application_id: string;
          date: string;
          interview_time: string;
          duration: number;
          status: string;
          type: string;
          location: string;
          notes: string;
          created_at: string;
          updated_at: string;
          candidate_first_name: string;
          candidate_last_name: string;
          candidate_email: string;
        }[];
      };
      get_job_messages: {
        Args: { p_job_id: string; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          text: string;
          user_id: string;
          job_id: string;
          reply_to_id: string;
          attachment_url: string;
          attachment_name: string;
          attachment_size: number;
          attachment_type: string;
          created_at: string;
          updated_at: string;
          edited_at: string;
          status: string;
          user_first_name: string;
          user_last_name: string;
          user_email: string;
          user_role: string;
          reply_to_text: string;
          reply_to_user_first_name: string;
          reply_to_user_last_name: string;
        }[];
      };
      get_job_permissions: {
        Args: { p_job_id: string };
        Returns: {
          id: string;
          job_id: string;
          user_id: string;
          permission_level: string;
          granted_at: string;
          created_at: string;
          updated_at: string;
          granted_by: string;
          user_first_name: string;
          user_last_name: string;
          user_email: string;
          user_role: string;
          granted_by_first_name: string;
          granted_by_last_name: string;
          granted_by_email: string;
        }[];
      };
      get_or_create_ai_preferences: {
        Args: {
          p_user_id: string;
          p_company_id: string;
          p_default_config?: Json;
        };
        Returns: {
          company_id: string;
          config: Json;
          created_at: string | null;
          id: string;
          provider_configs: Json;
          updated_at: string | null;
          user_id: string;
        };
      };
      get_stripe_checkout_link: {
        Args: {
          subscription_name: string;
          environment?: string;
          billing_period?: string;
        };
        Returns: string;
      };
      get_stripe_price_id: {
        Args: {
          subscription_name: string;
          environment?: string;
          billing_period?: string;
        };
        Returns: string;
      };
      get_team_response_summary: {
        Args: { candidate_uuid: string };
        Returns: {
          total_responses: number;
          avg_overall_rating: number;
          avg_technical_skills: number;
          avg_communication: number;
          avg_cultural_fit: number;
          hire_recommendations: number;
          no_hire_recommendations: number;
          maybe_recommendations: number;
        }[];
      };
      get_unread_message_count: {
        Args: { p_job_id: string; p_user_id: string };
        Returns: number;
      };
      get_unread_notification_count: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_upcoming_interviews: {
        Args: { p_company_id: string; p_limit?: number; p_offset?: number };
        Returns: {
          interview_id: string;
          interview_date: string;
          interview_time: string;
          interview_status: string;
          interview_title: string;
          job_title: string;
          candidate_name: string;
          candidate_email: string;
        }[];
      };
      get_user_subscription_details: {
        Args: { p_profile_id: string };
        Returns: {
          subscription_name: string;
          description: string;
          features: Json;
          limits: Json;
          status: string;
          current_period_start: string;
          current_period_end: string;
          is_trial: boolean;
          days_remaining: number;
        }[];
      };
      insert_test_message: {
        Args: { p_message?: string };
        Returns: string;
      };
      log_ai_evaluation_request: {
        Args: {
          p_function_name: string;
          p_payload: Json;
          p_response?: Json;
          p_status?: string;
          p_error_message?: string;
          p_execution_time_ms?: number;
        };
        Returns: string;
      };
      log_user_activity: {
        Args: {
          p_user_id: string;
          p_activity_type: string;
          p_entity_type: string;
          p_entity_id: string;
          p_title: string;
          p_description?: string;
          p_metadata?: Json;
        };
        Returns: string;
      };
      mark_messages_as_read: {
        Args: { p_message_ids: string[]; p_user_id: string };
        Returns: number;
      };
      mark_notifications_as_read: {
        Args: { notification_ids: string[] };
        Returns: number;
      };
      test_realtime_message_insert: {
        Args: { p_job_id: string; p_user_id: string; p_text?: string };
        Returns: string;
      };
      update_candidate_progress: {
        Args: {
          p_candidate_id: string;
          p_current_step: number;
          p_total_steps?: number;
          p_is_completed?: boolean;
        };
        Returns: Json;
      };
      user_can_access_job: {
        Args: { job_uuid: string; user_uuid: string };
        Returns: boolean;
      };
      validate_user_metadata: {
        Args: { metadata: Json };
        Returns: boolean;
      };
    };
    Enums: {
      contract_category: 'general' | 'technical' | 'executive' | 'intern' | 'freelance' | 'custom';
      contract_status: 'draft' | 'active' | 'archived' | 'deprecated';
      job_type:
        | 'full_time'
        | 'part_time'
        | 'contract'
        | 'temporary'
        | 'volunteer'
        | 'internship'
        | 'other';
      workplace_type: 'on_site' | 'remote' | 'hybrid';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      contract_category: ['general', 'technical', 'executive', 'intern', 'freelance', 'custom'],
      contract_status: ['draft', 'active', 'archived', 'deprecated'],
      job_type: [
        'full_time',
        'part_time',
        'contract',
        'temporary',
        'volunteer',
        'internship',
        'other',
      ],
      workplace_type: ['on_site', 'remote', 'hybrid'],
    },
  },
} as const;
