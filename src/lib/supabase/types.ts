export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ai_evaluations: {
        Row: {
          id: string;
          candidate_id: string;
          job_id: string;
          overall_score: number;
          overall_status: string;
          recommendation: string;
          evaluation_summary: string;
          evaluation_explanation: string;
          radar_metrics: Json;
          category_scores: Json;
          key_strengths: Json;
          areas_for_improvement: Json;
          red_flags: Json;
          evaluation_sources: Json;
          processing_duration_ms: number | null;
          ai_model_version: string | null;
          evaluation_version: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          job_id: string;
          overall_score: number;
          overall_status: string;
          recommendation: string;
          evaluation_summary: string;
          evaluation_explanation: string;
          radar_metrics?: Json;
          category_scores?: Json;
          key_strengths?: Json;
          areas_for_improvement?: Json;
          red_flags?: Json;
          evaluation_sources?: Json;
          processing_duration_ms?: number | null;
          ai_model_version?: string | null;
          evaluation_version?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          job_id?: string;
          overall_score?: number;
          overall_status?: string;
          recommendation?: string;
          evaluation_summary?: string;
          evaluation_explanation?: string;
          radar_metrics?: Json;
          category_scores?: Json;
          key_strengths?: Json;
          areas_for_improvement?: Json;
          red_flags?: Json;
          evaluation_sources?: Json;
          processing_duration_ms?: number | null;
          ai_model_version?: string | null;
          evaluation_version?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_evaluations_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      candidates: {
        Row: {
          id: string;
          job_id: string;
          candidate_info_id: string | null;
          interview_token: string | null;
          current_step: number | null;
          total_steps: number | null;
          is_completed: boolean | null;
          submitted_at: string | null;
          candidate_status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          candidate_info_id?: string | null;
          interview_token?: string | null;
          current_step?: number | null;
          total_steps?: number | null;
          is_completed?: boolean | null;
          submitted_at?: string | null;
          candidate_status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          candidate_info_id?: string | null;
          interview_token?: string | null;
          current_step?: number | null;
          total_steps?: number | null;
          is_completed?: boolean | null;
          submitted_at?: string | null;
          candidate_status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'candidates_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
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
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          linkedin_url: string | null;
          portfolio_url: string | null;
          additional_info: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          additional_info?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          additional_info?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      candidate_resumes: {
        Row: {
          id: string;
          candidate_id: string | null;
          job_id: string;
          email: string;
          original_filename: string;
          file_path: string;
          public_url: string | null;
          file_size: number | null;
          file_type: string | null;
          word_count: number | null;
          parsing_status: string | null;
          parsing_error: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          candidate_id?: string | null;
          job_id: string;
          email: string;
          original_filename: string;
          file_path: string;
          public_url?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          word_count?: number | null;
          parsing_status?: string | null;
          parsing_error?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          candidate_id?: string | null;
          job_id?: string;
          email?: string;
          original_filename?: string;
          file_path?: string;
          public_url?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          word_count?: number | null;
          parsing_status?: string | null;
          parsing_error?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'candidate_resumes_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_resumes_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: string;
          description: string | null;
          sort_order: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          description?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          description?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          website: string | null;
          logo_url: string | null;
          industry: string | null;
          size_range: string | null;
          created_at: string | null;
          updated_at: string | null;
          bio: string | null;
          logo_path: string | null;
          slug: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          industry?: string | null;
          size_range?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          bio?: string | null;
          logo_path?: string | null;
          slug?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          industry?: string | null;
          size_range?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          bio?: string | null;
          logo_path?: string | null;
          slug?: string | null;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          id: string;
          name: string;
          created_at: string | null;
          updated_at: string | null;
          company_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string | null;
          updated_at?: string | null;
          company_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string | null;
          updated_at?: string | null;
          company_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'departments_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      employment_types: {
        Row: {
          id: string;
          name: string;
          company_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          company_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          company_id?: string | null;
          created_at?: string | null;
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
        ];
      };
      evaluation_analytics: {
        Row: {
          id: string;
          job_id: string;
          profile_id: string;
          total_candidates: number | null;
          total_ai_evaluations: number | null;
          total_team_assessments: number | null;
          score_distribution: Json;
          avg_overall_score: number | null;
          avg_team_rating: number | null;
          avg_radar_metrics: Json;
          recommendation_distribution: Json;
          last_calculated_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          profile_id: string;
          total_candidates?: number | null;
          total_ai_evaluations?: number | null;
          total_team_assessments?: number | null;
          score_distribution?: Json;
          avg_overall_score?: number | null;
          avg_team_rating?: number | null;
          avg_radar_metrics?: Json;
          recommendation_distribution?: Json;
          last_calculated_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          profile_id?: string;
          total_candidates?: number | null;
          total_ai_evaluations?: number | null;
          total_team_assessments?: number | null;
          score_distribution?: Json;
          avg_overall_score?: number | null;
          avg_team_rating?: number | null;
          avg_radar_metrics?: Json;
          recommendation_distribution?: Json;
          last_calculated_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'evaluation_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluation_analytics_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      job_permissions: {
        Row: {
          id: string;
          job_id: string;
          user_id: string;
          permission_level: string;
          granted_by: string | null;
          created_at: string | null;
          granted_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          user_id: string;
          permission_level: string;
          granted_by?: string | null;
          created_at?: string | null;
          granted_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          user_id?: string;
          permission_level?: string;
          granted_by?: string | null;
          created_at?: string | null;
          granted_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'job_permissions_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_permissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      job_titles: {
        Row: {
          id: string;
          name: string;
          company_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          company_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          company_id?: string | null;
          created_at?: string | null;
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
        ];
      };
      jobs: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          description: string | null;
          requirements: string | null;
          location: string | null;
          salary_range: string | null;
          employment_type: string | null;
          status: string | null;
          fields: Json | null;
          settings: Json | null;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          department_id: string | null;
          job_title_id: string | null;
          employment_type_id: string | null;
          workplace_type: string | null;
          job_type: string | null;
          salary_min: number | null;
          salary_max: number | null;
          salary_currency: string | null;
          salary_period: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          description?: string | null;
          requirements?: string | null;
          location?: string | null;
          salary_range?: string | null;
          employment_type?: string | null;
          status?: string | null;
          fields?: Json | null;
          settings?: Json | null;
          interview_format?: string | null;
          interview_token?: string | null;
          is_active?: boolean | null;
          department_id?: string | null;
          job_title_id?: string | null;
          employment_type_id?: string | null;
          workplace_type?: string | null;
          job_type?: string | null;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string | null;
          salary_period?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          description?: string | null;
          requirements?: string | null;
          location?: string | null;
          salary_range?: string | null;
          employment_type?: string | null;
          status?: string | null;
          fields?: Json | null;
          settings?: Json | null;
          interview_format?: string | null;
          interview_token?: string | null;
          is_active?: boolean | null;
          department_id?: string | null;
          job_title_id?: string | null;
          employment_type_id?: string | null;
          workplace_type?: string | null;
          job_type?: string | null;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string | null;
          salary_period?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
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
            foreignKeyName: 'jobs_employment_type_id_fkey';
            columns: ['employment_type_id'];
            isOneToOne: false;
            referencedRelation: 'employment_types';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          job_id: string;
          message_type: string | null;
          created_at: string | null;
          updated_at: string | null;
          text: string;
          reply_to_id: string | null;
          thread_id: string | null;
          attachment_url: string | null;
          attachment_name: string | null;
          attachment_size: number | null;
          attachment_type: string | null;
          status: string | null;
          edited_at: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          message_type?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          text: string;
          reply_to_id?: string | null;
          thread_id?: string | null;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_size?: number | null;
          attachment_type?: string | null;
          status?: string | null;
          edited_at?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          message_type?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          text?: string;
          reply_to_id?: string | null;
          thread_id?: string | null;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_size?: number | null;
          attachment_type?: string | null;
          status?: string | null;
          edited_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_reply_to_id_fkey';
            columns: ['reply_to_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
      };
      message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string | null;
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
            foreignKeyName: 'message_reactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      message_read_status: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          read_at?: string | null;
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
            foreignKeyName: 'message_read_status_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          role: string | null;
          company_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          company_id?: string | null;
          created_at?: string | null;
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
        ];
      };
      realtime_test: {
        Row: {
          id: string;
          message: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          message: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          message?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      responses: {
        Row: {
          id: string;
          candidate_id: string;
          question_id: string;
          answer: string;
          created_at: string | null;
          job_question_id: string | null;
          resume_text: string | null;
          response_time: number | null;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          question_id: string;
          answer: string;
          created_at?: string | null;
          job_question_id?: string | null;
          resume_text?: string | null;
          response_time?: number | null;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          question_id?: string;
          answer?: string;
          created_at?: string | null;
          job_question_id?: string | null;
          resume_text?: string | null;
          response_time?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'responses_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_monthly: number | null;
          price_yearly: number | null;
          max_jobs: number | null;
          max_interviews_per_month: number | null;
          features: Json | null;
          limits: Json | null;
          is_active: boolean | null;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          trial_days: number | null;
          interval: string | null;
          created_at: string | null;
          updated_at: string | null;
          stripe_price_id_dev: string | null;
          stripe_price_id_prod: string | null;
          stripe_price_id_dev_yearly: string | null;
          stripe_price_id_prod_yearly: string | null;
          stripe_checkout_link_dev: string | null;
          stripe_checkout_link_prod: string | null;
          stripe_checkout_link_dev_yearly: string | null;
          stripe_checkout_link_prod_yearly: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_monthly?: number | null;
          price_yearly?: number | null;
          max_jobs?: number | null;
          max_interviews_per_month?: number | null;
          features?: Json | null;
          limits?: Json | null;
          is_active?: boolean | null;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          trial_days?: number | null;
          interval?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          stripe_price_id_dev?: string | null;
          stripe_price_id_prod?: string | null;
          stripe_price_id_dev_yearly?: string | null;
          stripe_price_id_prod_yearly?: string | null;
          stripe_checkout_link_dev?: string | null;
          stripe_checkout_link_prod?: string | null;
          stripe_checkout_link_dev_yearly?: string | null;
          stripe_checkout_link_prod_yearly?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_monthly?: number | null;
          price_yearly?: number | null;
          max_jobs?: number | null;
          max_interviews_per_month?: number | null;
          features?: Json | null;
          limits?: Json | null;
          is_active?: boolean | null;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          trial_days?: number | null;
          interval?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          stripe_price_id_dev?: string | null;
          stripe_price_id_prod?: string | null;
          stripe_price_id_dev_yearly?: string | null;
          stripe_price_id_prod_yearly?: string | null;
          stripe_checkout_link_dev?: string | null;
          stripe_checkout_link_prod?: string | null;
          stripe_checkout_link_dev_yearly?: string | null;
          stripe_checkout_link_prod_yearly?: string | null;
        };
        Relationships: [];
      };
      team_assessments: {
        Row: {
          id: string;
          candidate_id: string;
          job_id: string;
          ai_evaluation_id: string | null;
          assessor_profile_id: string;
          assessor_name: string;
          assessor_role: string;
          overall_rating: number;
          overall_rating_status: string;
          category_ratings: Json;
          assessment_comments: string | null;
          private_notes: string | null;
          assessment_type: string;
          interview_duration_minutes: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          job_id: string;
          ai_evaluation_id?: string | null;
          assessor_profile_id: string;
          assessor_name: string;
          assessor_role: string;
          overall_rating: number;
          overall_rating_status: string;
          category_ratings?: Json;
          assessment_comments?: string | null;
          private_notes?: string | null;
          assessment_type: string;
          interview_duration_minutes?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          job_id?: string;
          ai_evaluation_id?: string | null;
          assessor_profile_id?: string;
          assessor_name?: string;
          assessor_role?: string;
          overall_rating?: number;
          overall_rating_status?: string;
          category_ratings?: Json;
          assessment_comments?: string | null;
          private_notes?: string | null;
          assessment_type?: string;
          interview_duration_minutes?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'team_assessments_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_assessments_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
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
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_subscriptions: {
        Row: {
          id: string;
          profile_id: string;
          subscription_id: string;
          status: string | null;
          started_at: string | null;
          expires_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          trial_start: string | null;
          trial_end: string | null;
          cancel_at_period_end: boolean | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          subscription_id: string;
          status?: string | null;
          started_at?: string | null;
          expires_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          subscription_id?: string;
          status?: string | null;
          started_at?: string | null;
          expires_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_subscriptions_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_subscriptions_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      interviews: {
        Row: {
          id: string;
          application_id: string;
          job_id: string;
          title: string | null;
          date: string;
          time: string;
          timezone_id: string | null;
          duration: number;
          calendar_event_id: string | null;
          meet_link: string | null;
          status: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          reminder_sent_at: string | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          job_id: string;
          title?: string | null;
          date: string;
          time: string;
          timezone_id?: string | null;
          duration: number;
          calendar_event_id?: string | null;
          meet_link?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          reminder_sent_at?: string | null;
        };
        Update: {
          id?: string;
          application_id?: string;
          job_id?: string;
          title?: string | null;
          date?: string;
          time?: string;
          timezone_id?: string | null;
          duration?: number;
          calendar_event_id?: string | null;
          meet_link?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          reminder_sent_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'interviews_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      candidate_details: {
        Row: {
          id: string | null;
          candidate_info_id: string | null;
          job_id: string | null;
          interview_token: string | null;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          full_name: string | null;
          current_step: number | null;
          total_steps: number | null;
          is_completed: boolean | null;
          submitted_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          progress_percentage: number | null;
          job_title: string | null;
          job_status: string | null;
          profile_id: string | null;
          job_fields: Json | null;
          response_count: number | null;
          evaluation_id: string | null;
          score: number | null;
          recommendation: string | null;
          summary: string | null;
          strengths: Json | null;
          red_flags: Json | null;
          skills_assessment: Json | null;
          traits_assessment: Json | null;
          evaluation_created_at: string | null;
          evaluation_type: string | null;
          resume_score: number | null;
          resume_summary: string | null;
          resume_id: string | null;
          resume_filename: string | null;
          resume_file_path: string | null;
          resume_public_url: string | null;
          resume_file_size: number | null;
          resume_file_type: string | null;
          resume_word_count: number | null;
          resume_parsing_status: string | null;
          resume_parsing_error: string | null;
          resume_uploaded_at: string | null;
          status: string | null;
        };
        Relationships: [];
      };
      jobs_comprehensive: {
        Row: {
          id: string | null;
          profile_id: string | null;
          title: string | null;
          description: string | null;
          requirements: string | null;
          location: string | null;
          salary_range: string | null;
          employment_type: string | null;
          status: string | null;
          fields: Json | null;
          settings: Json | null;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          department_id: string | null;
          job_title_id: string | null;
          employment_type_id: string | null;
          workplace_type: string | null;
          job_type: string | null;
          salary_min: number | null;
          salary_max: number | null;
          salary_currency: string | null;
          salary_period: string | null;
          creator_details: Json | null;
          company_id: string | null;
          company_name: string | null;
          company_slug: string | null;
          company_logo_url: string | null;
          company_website: string | null;
          company_industry: string | null;
          company_size: string | null;
          department_name: string | null;
          job_title_name: string | null;
          employment_type_name: string | null;
          candidate_count: number | null;
          completed_interviews: number | null;
          response_count: number | null;
          evaluation_count: number | null;
          average_score: number | null;
        };
        Relationships: [];
      };
      jobs_detailed: {
        Row: {
          id: string | null;
          profile_id: string | null;
          title: string | null;
          description: string | null;
          requirements: string | null;
          location: string | null;
          salary_range: string | null;
          employment_type: string | null;
          status: string | null;
          fields: Json | null;
          settings: Json | null;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          department_id: string | null;
          job_title_id: string | null;
          employment_type_id: string | null;
          workplace_type: string | null;
          job_type: string | null;
          salary_min: number | null;
          salary_max: number | null;
          salary_currency: string | null;
          salary_period: string | null;
          created_at: string | null;
          updated_at: string | null;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          role: string | null;
          company_name_full: string | null;
          company_slug: string | null;
          department_name: string | null;
          job_title_name: string | null;
          employment_type_name: string | null;
          candidate_count: number | null;
          completed_interviews: number | null;
        };
        Relationships: [];
      };
      user_details: {
        Row: {
          id: string | null;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          role: string | null;
          user_created_at: string | null;
          user_updated_at: string | null;
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
          subscription_features: Json | null;
          stripe_price_id_dev: string | null;
          stripe_price_id_prod: string | null;
          stripe_price_id_dev_yearly: string | null;
          stripe_price_id_prod_yearly: string | null;
          stripe_checkout_link_dev: string | null;
          stripe_checkout_link_prod: string | null;
          stripe_checkout_link_dev_yearly: string | null;
          stripe_checkout_link_prod_yearly: string | null;
          subscription_status: string | null;
          subscription_started_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          trial_start: string | null;
          trial_end: string | null;
          cancel_at_period_end: boolean | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_updated_at: string | null;
          active_jobs_count: number | null;
          interviews_this_month: number | null;
        };
        Relationships: [];
      };
      interview_sessions: {
        Row: {
          candidate_id: string | null;
          job_id: string | null;
          job_title: string | null;
          interview_token: string | null;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          total_responses: number | null;
          total_questions: number | null;
          completion_percentage: number | null;
          started_at: string | null;
          last_response_at: string | null;
          is_completed: boolean | null;
          total_time_spent: number | null;
        };
        Relationships: [];
      };
      interview_details: {
        Row: {
          interview_id: string | null;
          application_id: string | null;
          job_id: string | null;
          interview_date: string | null;
          interview_time: string | null;
          timezone_id: string | null;
          duration: number | null;
          interview_status: string | null;
          notes: string | null;
          meet_link: string | null;
          calendar_event_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          reminder_sent_at: string | null;
          candidate_first_name: string | null;
          candidate_last_name: string | null;
          candidate_email: string | null;
          candidate_name: string | null;
          job_title: string | null;
          job_owner_id: string | null;
          company_name: string | null;
          company_id: string | null;
          event_summary: string | null;
          organizer_info: Json | null;
        };
        Relationships: [];
      };
      company_upcoming_interviews: {
        Row: {
          interview_id: string | null;
          interview_date: string | null;
          interview_time: string | null;
          interview_status: string | null;
          calendar_event_id: string | null;
          meet_link: string | null;
          candidate_id: string | null;
          candidate_first_name: string | null;
          candidate_last_name: string | null;
          candidate_email: string | null;
          job_id: string | null;
          job_title: string | null;
          company_id: string | null;
          company_name: string | null;
        };
        Relationships: [];
      };
      company_candidate_pipeline: {
        Row: {
          company_id: string | null;
          name: string | null;
          status: string | null;
          count: number | null;
        };
        Relationships: [];
      };
      candidate_analytics_summary: {
        Row: {
          job_id: string | null;
          job_title: string | null;
          profile_id: string | null;
          total_candidates: number | null;
          completed_applications: number | null;
          evaluated_candidates: number | null;
          avg_resume_score: number | null;
          successful_evaluations: number | null;
          failed_evaluations: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      aal_level: 'aal1' | 'aal2' | 'aal3';
      action: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE' | 'ERROR';
      candidate_status:
        | 'under_review'
        | 'interview_scheduled'
        | 'shortlisted'
        | 'reference_check'
        | 'offer_extended'
        | 'offer_accepted'
        | 'hired'
        | 'rejected'
        | 'withdrawn'
        | 'active';
      code_challenge_method: 'plain' | 's256';
      contract_category: 'employment' | 'freelance' | 'consulting' | 'other';
      contract_status:
        | 'draft'
        | 'pending'
        | 'signed'
        | 'active'
        | 'completed'
        | 'terminated'
        | 'cancelled';
      equality_op: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in';
      factor_status: 'unverified' | 'verified';
      factor_type: 'totp' | 'webauthn' | 'phone';
      interview_schedule_status:
        | 'scheduled'
        | 'completed'
        | 'cancelled'
        | 'rescheduled'
        | 'no_show'
        | 'pending';
      interview_type: 'video' | 'phone' | 'in_person';
      job_status: 'draft' | 'active' | 'interviewing' | 'paused' | 'closed';
      job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary';
      one_time_token_type:
        | 'confirmation_token'
        | 'reauthentication_token'
        | 'recovery_token'
        | 'email_change_token_new'
        | 'email_change_token_current'
        | 'phone_change_token';
      request_status: 'PENDING' | 'SUCCESS' | 'ERROR';
      user_role:
        | 'admin'
        | 'recruiter'
        | 'hiring_manager'
        | 'interviewer'
        | 'candidate'
        | 'developer';
      workplace_type: 'remote' | 'onsite' | 'hybrid';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof Database['public']['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicEnumNameOrOptions]
    : never;

// Additional utility types for common use cases
export type JobComprehensiveRow = Tables<'jobs_comprehensive'>;
export type JobDetailedRow = Tables<'jobs_detailed'>;
export type CandidateDetailsRow = Tables<'candidate_details'>;
export type UserDetailsRow = Tables<'user_details'>;
export type JobRow = Tables<'jobs'>;
export type ProfileRow = Tables<'profiles'>;
export type MessageRow = Tables<'messages'>;
export type MessageReactionRow = Tables<'message_reactions'>;
export type MessageReadStatusRow = Tables<'message_read_status'>;
export type CandidateRow = Tables<'candidates'>;
export type CandidateInfoRow = Tables<'candidates_info'>;
export type CandidateResumeRow = Tables<'candidate_resumes'>;
export type SubscriptionRow = Tables<'subscriptions'>;
export type UserSubscriptionRow = Tables<'user_subscriptions'>;
export type CompanyRow = Tables<'companies'>;
export type DepartmentRow = Tables<'departments'>;
export type JobTitleRow = Tables<'job_titles'>;
export type EmploymentTypeRow = Tables<'employment_types'>;
export type AIEvaluationRow = Tables<'ai_evaluations'>;
export type TeamAssessmentRow = Tables<'team_assessments'>;
export type EvaluationAnalyticsRow = Tables<'evaluation_analytics'>;
export type JobPermissionRow = Tables<'job_permissions'>;
export type ResponseRow = Tables<'responses'>;
export type CategoryRow = Tables<'categories'>;
export type RealtimeTestRow = Tables<'realtime_test'>;
export type InterviewRow = Tables<'interviews'>;
export type InterviewSessionRow = Tables<'interview_sessions'>;
export type InterviewDetailsRow = Tables<'interview_details'>;
export type CompanyUpcomingInterviewsRow = Tables<'company_upcoming_interviews'>;
export type CompanyCandidatePipelineRow = Tables<'company_candidate_pipeline'>;
export type CandidateAnalyticsSummaryRow = Tables<'candidate_analytics_summary'>;
