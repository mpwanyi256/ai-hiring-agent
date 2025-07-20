export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
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
            referencedRelation: 'candidates_info';
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
        ];
      };
      candidate_analytics: {
        Row: {
          ai_recommendation: string | null;
          ai_score: number | null;
          areas_for_improvement: string | null;
          average_response_time_seconds: number | null;
          candidate_id: string;
          communication_score: number | null;
          completion_percentage: number | null;
          confidence_score: number | null;
          created_at: string | null;
          engagement_level: string | null;
          id: string;
          interview_score: number | null;
          job_id: string;
          last_activity_at: string | null;
          overall_score: number | null;
          percentile_rank: number | null;
          problem_solving_score: number | null;
          questions_answered: number | null;
          rank_in_job: number | null;
          red_flags: string[] | null;
          response_quality_score: number | null;
          resume_score: number | null;
          strengths_summary: string | null;
          technical_score: number | null;
          time_spent_minutes: number | null;
          total_candidates_in_job: number | null;
          total_questions: number | null;
          total_responses: number | null;
          updated_at: string | null;
        };
        Insert: {
          ai_recommendation?: string | null;
          ai_score?: number | null;
          areas_for_improvement?: string | null;
          average_response_time_seconds?: number | null;
          candidate_id: string;
          communication_score?: number | null;
          completion_percentage?: number | null;
          confidence_score?: number | null;
          created_at?: string | null;
          engagement_level?: string | null;
          id?: string;
          interview_score?: number | null;
          job_id: string;
          last_activity_at?: string | null;
          overall_score?: number | null;
          percentile_rank?: number | null;
          problem_solving_score?: number | null;
          questions_answered?: number | null;
          rank_in_job?: number | null;
          red_flags?: string[] | null;
          response_quality_score?: number | null;
          resume_score?: number | null;
          strengths_summary?: string | null;
          technical_score?: number | null;
          time_spent_minutes?: number | null;
          total_candidates_in_job?: number | null;
          total_questions?: number | null;
          total_responses?: number | null;
          updated_at?: string | null;
        };
        Update: {
          ai_recommendation?: string | null;
          ai_score?: number | null;
          areas_for_improvement?: string | null;
          average_response_time_seconds?: number | null;
          candidate_id?: string;
          communication_score?: number | null;
          completion_percentage?: number | null;
          confidence_score?: number | null;
          created_at?: string | null;
          engagement_level?: string | null;
          id?: string;
          interview_score?: number | null;
          job_id?: string;
          last_activity_at?: string | null;
          overall_score?: number | null;
          percentile_rank?: number | null;
          problem_solving_score?: number | null;
          questions_answered?: number | null;
          rank_in_job?: number | null;
          red_flags?: string[] | null;
          response_quality_score?: number | null;
          resume_score?: number | null;
          strengths_summary?: string | null;
          technical_score?: number | null;
          time_spent_minutes?: number | null;
          total_candidates_in_job?: number | null;
          total_questions?: number | null;
          total_responses?: number | null;
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
          {
            foreignKeyName: 'candidate_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'candidate_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'candidate_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_analytics_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
          },
        ];
      };
      candidate_response_analytics: {
        Row: {
          ai_feedback: string | null;
          ai_score: number | null;
          candidate_id: string;
          clarity_score: number | null;
          confidence_level: number | null;
          created_at: string | null;
          emotional_tone: string | null;
          grammar_score: number | null;
          id: string;
          improvement_suggestions: string[] | null;
          keyword_matches: number | null;
          response_id: string;
          response_length_words: number | null;
          response_quality_score: number | null;
          response_time_seconds: number | null;
          sentiment_score: number | null;
          technical_terms_count: number | null;
        };
        Insert: {
          ai_feedback?: string | null;
          ai_score?: number | null;
          candidate_id: string;
          clarity_score?: number | null;
          confidence_level?: number | null;
          created_at?: string | null;
          emotional_tone?: string | null;
          grammar_score?: number | null;
          id?: string;
          improvement_suggestions?: string[] | null;
          keyword_matches?: number | null;
          response_id: string;
          response_length_words?: number | null;
          response_quality_score?: number | null;
          response_time_seconds?: number | null;
          sentiment_score?: number | null;
          technical_terms_count?: number | null;
        };
        Update: {
          ai_feedback?: string | null;
          ai_score?: number | null;
          candidate_id?: string;
          clarity_score?: number | null;
          confidence_level?: number | null;
          created_at?: string | null;
          emotional_tone?: string | null;
          grammar_score?: number | null;
          id?: string;
          improvement_suggestions?: string[] | null;
          keyword_matches?: number | null;
          response_id?: string;
          response_length_words?: number | null;
          response_quality_score?: number | null;
          response_time_seconds?: number | null;
          sentiment_score?: number | null;
          technical_terms_count?: number | null;
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
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          job_id: string;
          original_filename: string;
          parsing_error: string | null;
          parsing_status: string | null;
          public_url: string;
          updated_at: string | null;
          word_count: number | null;
        };
        Insert: {
          candidate_id?: string | null;
          created_at?: string | null;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          job_id: string;
          original_filename: string;
          parsing_error?: string | null;
          parsing_status?: string | null;
          public_url: string;
          updated_at?: string | null;
          word_count?: number | null;
        };
        Update: {
          candidate_id?: string | null;
          created_at?: string | null;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          job_id?: string;
          original_filename?: string;
          parsing_error?: string | null;
          parsing_status?: string | null;
          public_url?: string;
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
          {
            foreignKeyName: 'candidate_resumes_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'candidate_resumes_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'candidate_resumes_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_resumes_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
          },
        ];
      };
      candidates: {
        Row: {
          candidate_info_id: string;
          created_at: string | null;
          current_step: number | null;
          id: string;
          interview_token: string;
          is_completed: boolean | null;
          job_id: string;
          profile_id: string | null;
          status: Database['public']['Enums']['candidate_status'];
          submitted_at: string | null;
          total_steps: number | null;
          updated_at: string | null;
        };
        Insert: {
          candidate_info_id: string;
          created_at?: string | null;
          current_step?: number | null;
          id?: string;
          interview_token: string;
          is_completed?: boolean | null;
          job_id: string;
          profile_id?: string | null;
          status?: Database['public']['Enums']['candidate_status'];
          submitted_at?: string | null;
          total_steps?: number | null;
          updated_at?: string | null;
        };
        Update: {
          candidate_info_id?: string;
          created_at?: string | null;
          current_step?: number | null;
          id?: string;
          interview_token?: string;
          is_completed?: boolean | null;
          job_id?: string;
          profile_id?: string | null;
          status?: Database['public']['Enums']['candidate_status'];
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
          {
            foreignKeyName: 'candidates_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'candidates_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'candidates_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidates_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidates_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidates_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      candidates_info: {
        Row: {
          created_at: string | null;
          email: string | null;
          first_name: string;
          id: string;
          last_name: string | null;
          linkedin_url: string | null;
          phone: string | null;
          portfolio_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          first_name: string;
          id?: string;
          last_name?: string | null;
          linkedin_url?: string | null;
          phone?: string | null;
          portfolio_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          first_name?: string;
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
          id: string;
          logo_path: string | null;
          logo_url: string | null;
          name: string;
          slug: string | null;
          timezone_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          logo_path?: string | null;
          logo_url?: string | null;
          name: string;
          slug?: string | null;
          timezone_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          logo_path?: string | null;
          logo_url?: string | null;
          name?: string;
          slug?: string | null;
          timezone_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_companies_timezone_id';
            columns: ['timezone_id'];
            isOneToOne: false;
            referencedRelation: 'timezones';
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
      departments: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      employment_types: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
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
          candidate_id: string;
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
          score: number;
          skills_assessment: Json | null;
          strengths: Json | null;
          summary: string;
          traits_assessment: Json | null;
          updated_at: string | null;
        };
        Insert: {
          candidate_id: string;
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
          score: number;
          skills_assessment?: Json | null;
          strengths?: Json | null;
          summary: string;
          traits_assessment?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          candidate_id?: string;
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
          score?: number;
          skills_assessment?: Json | null;
          strengths?: Json | null;
          summary?: string;
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
            foreignKeyName: 'evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
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
          candidate_id: string | null;
          completed_at: string | null;
          created_at: string | null;
          error_message: string | null;
          function_name: string;
          id: string;
          job_id: string | null;
          payload: Json;
          status: string | null;
          triggered_at: string | null;
        };
        Insert: {
          candidate_id?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          function_name: string;
          id?: string;
          job_id?: string | null;
          payload: Json;
          status?: string | null;
          triggered_at?: string | null;
        };
        Update: {
          candidate_id?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          function_name?: string;
          id?: string;
          job_id?: string | null;
          payload?: Json;
          status?: string | null;
          triggered_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'function_logs_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'function_logs_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'function_logs_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'function_logs_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
          },
        ];
      };
      integrations: {
        Row: {
          access_token: string;
          company_id: string;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          metadata: Json | null;
          provider: string;
          refresh_token: string | null;
          scope: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token: string;
          company_id: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          metadata?: Json | null;
          provider: string;
          refresh_token?: string | null;
          scope?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string;
          company_id?: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          metadata?: Json | null;
          provider?: string;
          refresh_token?: string | null;
          scope?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'integrations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'integrations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_candidate_pipeline';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'integrations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'integrations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'interview_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'integrations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'integrations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'integrations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'integrations_user_id_fkey';
            columns: ['user_id'];
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
          status: string;
          time: string;
          timezone_id: string;
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
          status?: string;
          time: string;
          timezone_id: string;
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
          status?: string;
          time?: string;
          timezone_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_interviews_timezone_id';
            columns: ['timezone_id'];
            isOneToOne: false;
            referencedRelation: 'timezones';
            referencedColumns: ['id'];
          },
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
            foreignKeyName: 'interviews_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'interviews_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'interviews_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interviews_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
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
        ];
      };
      job_templates: {
        Row: {
          created_at: string | null;
          fields: Json | null;
          id: string;
          interview_format: string | null;
          is_active: boolean | null;
          name: string;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          fields?: Json | null;
          id?: string;
          interview_format?: string | null;
          is_active?: boolean | null;
          name: string;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          fields?: Json | null;
          id?: string;
          interview_format?: string | null;
          is_active?: boolean | null;
          name?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      job_titles: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          created_at: string | null;
          department_id: string | null;
          employment_type_id: string | null;
          fields: Json | null;
          id: string;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          job_title_id: string | null;
          job_type: Database['public']['Enums']['job_type'] | null;
          profile_id: string;
          status: Database['public']['Enums']['job_status'];
          title: string;
          updated_at: string | null;
          workplace_type: Database['public']['Enums']['workplace_type'] | null;
        };
        Insert: {
          created_at?: string | null;
          department_id?: string | null;
          employment_type_id?: string | null;
          fields?: Json | null;
          id?: string;
          interview_format?: string | null;
          interview_token?: string | null;
          is_active?: boolean | null;
          job_title_id?: string | null;
          job_type?: Database['public']['Enums']['job_type'] | null;
          profile_id: string;
          status?: Database['public']['Enums']['job_status'];
          title: string;
          updated_at?: string | null;
          workplace_type?: Database['public']['Enums']['workplace_type'] | null;
        };
        Update: {
          created_at?: string | null;
          department_id?: string | null;
          employment_type_id?: string | null;
          fields?: Json | null;
          id?: string;
          interview_format?: string | null;
          interview_token?: string | null;
          is_active?: boolean | null;
          job_title_id?: string | null;
          job_type?: Database['public']['Enums']['job_type'] | null;
          profile_id?: string;
          status?: Database['public']['Enums']['job_status'];
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
      profiles: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          role: Database['public']['Enums']['user_role'];
          updated_at: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          role?: Database['public']['Enums']['user_role'];
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
      responses: {
        Row: {
          answer: string;
          candidate_id: string;
          created_at: string | null;
          id: string;
          job_id: string | null;
          job_question_id: string | null;
          profile_id: string | null;
          question: string;
          response_time: number | null;
          resume_text: string | null;
        };
        Insert: {
          answer: string;
          candidate_id: string;
          created_at?: string | null;
          id?: string;
          job_id?: string | null;
          job_question_id?: string | null;
          profile_id?: string | null;
          question: string;
          response_time?: number | null;
          resume_text?: string | null;
        };
        Update: {
          answer?: string;
          candidate_id?: string;
          created_at?: string | null;
          id?: string;
          job_id?: string | null;
          job_question_id?: string | null;
          profile_id?: string | null;
          question?: string;
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
            foreignKeyName: 'responses_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'responses_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'responses_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'responses_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
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
          {
            foreignKeyName: 'responses_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'responses_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
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
          key_name: string;
          key_value: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_encrypted?: boolean | null;
          key_name: string;
          key_value: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_encrypted?: boolean | null;
          key_name?: string;
          key_value?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
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
          max_interviews_per_month: number | null;
          max_jobs: number | null;
          name: string;
          price_monthly: number | null;
          price_yearly: number | null;
          stripe_checkout_link_dev: string | null;
          stripe_checkout_link_dev_yearly: string | null;
          stripe_checkout_link_prod: string | null;
          stripe_checkout_link_prod_yearly: string | null;
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
          max_interviews_per_month?: number | null;
          max_jobs?: number | null;
          name: string;
          price_monthly?: number | null;
          price_yearly?: number | null;
          stripe_checkout_link_dev?: string | null;
          stripe_checkout_link_dev_yearly?: string | null;
          stripe_checkout_link_prod?: string | null;
          stripe_checkout_link_prod_yearly?: string | null;
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
          max_interviews_per_month?: number | null;
          max_jobs?: number | null;
          name?: string;
          price_monthly?: number | null;
          price_yearly?: number | null;
          stripe_checkout_link_dev?: string | null;
          stripe_checkout_link_dev_yearly?: string | null;
          stripe_checkout_link_prod?: string | null;
          stripe_checkout_link_prod_yearly?: string | null;
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
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
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
        ];
      };
      user_activities: {
        Row: {
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          event_type: string;
          id: string;
          message: string | null;
          meta: Json | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          event_type: string;
          id?: string;
          message?: string | null;
          meta?: Json | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          event_type?: string;
          id?: string;
          message?: string | null;
          meta?: Json | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_user_activities_user_id';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_user_activities_user_id';
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
          started_at: string | null;
          status: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_id: string;
          trial_end: string | null;
          trial_start: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          expires_at?: string | null;
          id?: string;
          started_at?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_id: string;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          expires_at?: string | null;
          id?: string;
          started_at?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_id?: string;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
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
    };
    Views: {
      candidate_details: {
        Row: {
          candidate_info_id: string | null;
          candidate_status: Database['public']['Enums']['candidate_status'] | null;
          created_at: string | null;
          current_step: number | null;
          email: string | null;
          evaluation_created_at: string | null;
          evaluation_id: string | null;
          evaluation_type: string | null;
          first_name: string | null;
          full_name: string | null;
          id: string | null;
          interview_details: Json | null;
          interview_token: string | null;
          is_completed: boolean | null;
          job_fields: Json | null;
          job_id: string | null;
          job_status: Database['public']['Enums']['job_status'] | null;
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
            foreignKeyName: 'candidates_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'candidates_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'candidates_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidates_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
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
          status: Database['public']['Enums']['candidate_status'] | null;
        };
        Relationships: [];
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
          interview_date: string | null;
          interview_id: string | null;
          interview_status: string | null;
          interview_time: string | null;
          job_id: string | null;
          job_owner_id: string | null;
          job_title: string | null;
          meet_link: string | null;
          notes: string | null;
          timezone_id: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_interviews_timezone_id';
            columns: ['timezone_id'];
            isOneToOne: false;
            referencedRelation: 'timezones';
            referencedColumns: ['id'];
          },
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
            foreignKeyName: 'interviews_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'interviews_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'interviews_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interviews_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
            referencedColumns: ['id'];
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
      job_evaluations: {
        Row: {
          candidate_email: string | null;
          candidate_first_name: string | null;
          candidate_id: string | null;
          candidate_last_name: string | null;
          candidate_name: string | null;
          created_at: string | null;
          evaluation_type: string | null;
          feedback: string | null;
          id: string | null;
          job_id: string | null;
          recommendation: string | null;
          red_flags: Json | null;
          resume_score: number | null;
          score: number | null;
          strengths: Json | null;
          summary: string | null;
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
            foreignKeyName: 'evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'company_upcoming_interviews';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'job_questions_overview';
            referencedColumns: ['job_id'];
          },
          {
            foreignKeyName: 'evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evaluations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs_comprehensive';
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
          job_status: Database['public']['Enums']['job_status'] | null;
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
          ai_generated_questions: number | null;
          avg_evaluation_score: number | null;
          combined_evaluations: number | null;
          completed_interviews: number | null;
          estimated_duration: number | null;
          in_progress_interviews: number | null;
          interview_evaluations: number | null;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          job_created_at: string | null;
          job_fields: Json | null;
          job_id: string | null;
          job_title: string | null;
          job_updated_at: string | null;
          optional_questions: number | null;
          profile_id: string | null;
          recommended_candidates: number | null;
          required_questions: number | null;
          resume_evaluations: number | null;
          status: Database['public']['Enums']['job_status'] | null;
          total_candidates: number | null;
          total_evaluations: number | null;
          total_questions: number | null;
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
            foreignKeyName: 'jobs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'user_details';
            referencedColumns: ['id'];
          },
        ];
      };
      jobs_comprehensive: {
        Row: {
          average_score: number | null;
          candidate_count: number | null;
          company_bio: string | null;
          company_id: string | null;
          company_logo_path: string | null;
          company_logo_url: string | null;
          company_name: string | null;
          company_slug: string | null;
          completed_interviews: number | null;
          created_at: string | null;
          creator_details: Json | null;
          department_id: string | null;
          employment_type_id: string | null;
          evaluation_count: number | null;
          fields: Json | null;
          id: string | null;
          interview_format: string | null;
          interview_token: string | null;
          is_active: boolean | null;
          job_title_id: string | null;
          job_type: Database['public']['Enums']['job_type'] | null;
          profile_id: string | null;
          response_count: number | null;
          status: Database['public']['Enums']['job_status'] | null;
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
      skills_view: {
        Row: {
          category: string | null;
          category_description: string | null;
          category_sort_order: number | null;
          created_at: string | null;
          description: string | null;
          id: string | null;
          is_active: boolean | null;
          name: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      traits_view: {
        Row: {
          category: string | null;
          category_description: string | null;
          category_sort_order: number | null;
          created_at: string | null;
          description: string | null;
          id: string | null;
          is_active: boolean | null;
          name: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      user_activities_resolved: {
        Row: {
          company_id: string | null;
          company_name: string | null;
          created_at: string | null;
          entity_id: string | null;
          entity_type: string | null;
          event_type: string | null;
          id: string | null;
          message: string | null;
          meta: Json | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_user_activities_user_id';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_user_activities_user_id';
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
          role: Database['public']['Enums']['user_role'] | null;
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
    };
    Functions: {
      bytea_to_text: {
        Args: { data: string };
        Returns: string;
      };
      calculate_candidate_analytics: {
        Args: { candidate_uuid: string; job_uuid: string };
        Returns: undefined;
      };
      calculate_response_analytics: {
        Args: { response_uuid: string };
        Returns: undefined;
      };
      check_available_extensions: {
        Args: Record<PropertyKey, never>;
        Returns: {
          extension_name: string;
          function_name: string;
          function_signature: string;
        }[];
      };
      check_existing_resume_evaluation: {
        Args: { p_candidate_id: string; p_job_id: string };
        Returns: Json;
      };
      check_failed_pgnet_requests: {
        Args: Record<PropertyKey, never>;
        Returns: {
          request_id: number;
          status_code: number;
          error_msg: string;
          created: string;
        }[];
      };
      check_pgnet_responses: {
        Args: Record<PropertyKey, never>;
        Returns: {
          request_id: number;
          status_code: number;
          content_type: string;
          content: string;
          error_msg: string;
          created: string;
        }[];
      };
      check_user_interview_limits: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      create_candidate: {
        Args: {
          p_first_name: string;
          p_last_name: string;
          p_email: string;
          p_job_id: string;
          p_interview_token: string;
        };
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
      create_candidate_profile_and_record: {
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
      get_candidate_analytics: {
        Args: { candidate_uuid: string; job_uuid: string };
        Returns: {
          analytics: Json;
          response_analytics: Json;
          comparative_data: Json;
          ai_assessment: Json;
        }[];
      };
      get_candidate_details: {
        Args: { p_interview_token: string };
        Returns: Json;
      };
      get_candidate_responses: {
        Args: { p_candidate_id: string; p_profile_id?: string };
        Returns: {
          id: string;
          question_text: string;
          response_text: string;
          response_time: number;
          created_at: string;
        }[];
      };
      get_candidate_resume_url: {
        Args: { p_candidate_id: string; p_profile_id: string };
        Returns: {
          resume_id: string;
          original_filename: string;
          public_url: string;
          file_size: number;
          file_type: string;
        }[];
      };
      get_candidate_with_info: {
        Args: { p_candidate_id: string };
        Returns: Json;
      };
      get_candidate_with_profile: {
        Args: { p_candidate_id: string };
        Returns: Json;
      };
      get_company_subscription: {
        Args: { user_id: string };
        Returns: {
          company_id: string;
          company_name: string;
          company_slug: string;
          subscription_status: string;
          plan_name: string;
          plan_description: string;
          price_monthly: number;
          price_yearly: number;
          max_jobs: number;
          max_interviews_per_month: number;
          features: Json;
          total_jobs_created_this_month: number;
          active_jobs_this_month: number;
          total_active_jobs: number;
          successful_interviews_this_month: number;
          total_interviews_this_month: number;
          company_active_jobs_count: number;
          company_interviews_this_month: number;
          company_user_count: number;
        }[];
      };
      get_job_candidate_details: {
        Args:
          | {
              p_job_id: string;
              p_profile_id: string;
              p_search?: string;
              p_status?: string;
              p_limit?: number;
              p_offset?: number;
              p_min_score?: number;
              p_max_score?: number;
              p_start_date?: string;
              p_end_date?: string;
              p_candidate_status?: string;
              p_sort_by?: string;
              p_sort_order?: string;
            }
          | {
              p_job_id: string;
              p_search?: string;
              p_status?: string;
              p_limit?: number;
              p_offset?: number;
            };
        Returns: {
          id: string;
          job_id: string;
          interview_token: string;
          email: string;
          first_name: string;
          last_name: string;
          full_name: string;
          current_step: number;
          total_steps: number;
          is_completed: boolean;
          submitted_at: string;
          created_at: string;
          updated_at: string;
          progress_percentage: number;
          status: string;
          response_count: number;
          job_title: string;
          job_status: string;
          profile_id: string;
          job_fields: Json;
          evaluation_id: string;
          score: number;
          recommendation: string;
          summary: string;
          strengths: Json;
          red_flags: Json;
          skills_assessment: Json;
          traits_assessment: Json;
          evaluation_created_at: string;
          resume_id: string;
          resume_filename: string;
          resume_file_path: string;
          resume_public_url: string;
          resume_file_size: number;
          resume_file_type: string;
          resume_word_count: number;
          resume_parsing_status: string;
          resume_parsing_error: string;
          resume_uploaded_at: string;
          resume_score: number;
          resume_summary: string;
          evaluation_type: string;
          candidate_status: Database['public']['Enums']['candidate_status'];
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
      get_resume_evaluation: {
        Args: { p_candidate_id: string; p_job_id: string };
        Returns: Json;
      };
      get_service_role_key: {
        Args: Record<PropertyKey, never>;
        Returns: string;
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
      get_supabase_project_ref: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_current_month_usage: {
        Args: { user_id: string };
        Returns: {
          total_jobs_created: number;
          active_jobs: number;
          successful_interviews: number;
          total_interviews: number;
          current_month: string;
        }[];
      };
      get_user_interview_usage: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      http: {
        Args: { request: Database['public']['CompositeTypes']['http_request'] };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_delete: {
        Args: { uri: string } | { uri: string; content: string; content_type: string };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_get: {
        Args: { uri: string } | { uri: string; data: Json };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_head: {
        Args: { uri: string };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_header: {
        Args: { field: string; value: string };
        Returns: Database['public']['CompositeTypes']['http_header'];
      };
      http_list_curlopt: {
        Args: Record<PropertyKey, never>;
        Returns: {
          curlopt: string;
          value: string;
        }[];
      };
      http_patch: {
        Args: { uri: string; content: string; content_type: string };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_post: {
        Args: { uri: string; content: string; content_type: string } | { uri: string; data: Json };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_put: {
        Args: { uri: string; content: string; content_type: string };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      http_set_curlopt: {
        Args: { curlopt: string; value: string };
        Returns: boolean;
      };
      manual_trigger_ai_evaluation: {
        Args: { p_candidate_id: string; p_force?: boolean };
        Returns: Json;
      };
      process_pending_ai_evaluations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          candidate_id: string;
          job_id: string;
          payload: Json;
          message: string;
        }[];
      };
      set_supabase_project_ref: {
        Args: { project_ref: string };
        Returns: string;
      };
      test_pgnet_connection: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      test_pgnet_simple: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      text_to_bytea: {
        Args: { data: string };
        Returns: string;
      };
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string };
        Returns: string;
      };
    };
    Enums: {
      candidate_status:
        | 'under_review'
        | 'interview_scheduled'
        | 'shortlisted'
        | 'reference_check'
        | 'offer_extended'
        | 'offer_accepted'
        | 'hired'
        | 'rejected'
        | 'withdrawn';
      interview_schedule_status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
      interview_type: 'video' | 'phone' | 'in_person';
      job_status: 'draft' | 'interviewing' | 'closed';
      job_type:
        | 'full_time'
        | 'part_time'
        | 'contract'
        | 'temporary'
        | 'volunteer'
        | 'internship'
        | 'other';
      user_role: 'recruiter' | 'candidate' | 'admin' | 'developer';
      workplace_type: 'on_site' | 'remote' | 'hybrid';
    };
    CompositeTypes: {
      http_header: {
        field: string | null;
        value: string | null;
      };
      http_request: {
        method: unknown | null;
        uri: string | null;
        headers: Database['public']['CompositeTypes']['http_header'][] | null;
        content_type: string | null;
        content: string | null;
      };
      http_response: {
        status: number | null;
        content_type: string | null;
        headers: Database['public']['CompositeTypes']['http_header'][] | null;
        content: string | null;
      };
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      candidate_status: [
        'under_review',
        'interview_scheduled',
        'shortlisted',
        'reference_check',
        'offer_extended',
        'offer_accepted',
        'hired',
        'rejected',
        'withdrawn',
      ],
      interview_schedule_status: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      interview_type: ['video', 'phone', 'in_person'],
      job_status: ['draft', 'interviewing', 'closed'],
      job_type: [
        'full_time',
        'part_time',
        'contract',
        'temporary',
        'volunteer',
        'internship',
        'other',
      ],
      user_role: ['recruiter', 'candidate', 'admin', 'developer'],
      workplace_type: ['on_site', 'remote', 'hybrid'],
    },
  },
} as const;
