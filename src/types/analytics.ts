export interface AnalyticsData {
  analytics: {
    total_responses: number;
    average_response_time_seconds: number;
    completion_percentage: number;
    overall_score: number;
    resume_score: number;
    interview_score: number;
    ai_score: number | null;
    time_spent_minutes: number;
    engagement_level: string;
    rank_in_job: number;
    total_candidates_in_job: number;
    percentile_rank: number;
    total_questions: number;
  };
  response_analytics: Array<{
    response_id: string;
    response_length_words: number;
    response_time_seconds: number;
    response_quality_score: number;
    sentiment_score?: number;
    ai_score?: number;
  }>;
  comparative_data: {
    total_candidates: number;
    average_score: number;
    top_percentile: number;
    median_score: number;
    completion_rate: number;
    average_time_spent: number;
  };
  ai_assessment?: {
    overall_score: number;
    overall_status: 'excellent' | 'good' | 'average' | 'poor' | 'very_poor' | string;
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no' | string;
    evaluation_summary: string;
    evaluation_explanation: string;
    radar_metrics?: {
      skills?: number;
      growth_mindset?: number;
      team_work?: number;
      culture?: number;
      communication?: number;
    };
    category_scores?: Record<
      string,
      {
        score: number;
        explanation?: string;
        strengths?: string[];
        areas_for_improvement?: string[];
      }
    >;
    key_strengths?: string[];
    areas_for_improvement?: string[];
    red_flags?: string[];
  };
  team_summary?: {
    total_responses: number;
    positive_votes: number;
    negative_votes: number;
    neutral_votes: number;
    avg_confidence: number | null;
    avg_technical_skills: number | null;
    avg_communication_skills: number | null;
    avg_cultural_fit: number | null;
  };
}
