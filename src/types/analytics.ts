export interface AnalyticsData {
  analytics: {
    total_responses: number;
    average_response_time_seconds: number;
    completion_percentage: number;
    overall_score: number;
    resume_score: number;
    interview_score: number;
    ai_score: number;
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
}
