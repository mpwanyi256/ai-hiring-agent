// AI Evaluation System Types

// Evaluation status types
export type EvaluationStatus = 'excellent' | 'good' | 'average' | 'poor' | 'very_poor';
export type RecommendationType = 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
export type AssessmentType = 'interview' | 'resume_review' | 'technical_review' | 'culture_interview' | 'final_review';

// Radar chart metrics (based on the image: Skills, Growth Mindset, Team Work, Culture, Communication)
export interface RadarMetrics {
  skills: number; // 0-100
  growth_mindset: number; // 0-100
  team_work: number; // 0-100
  culture: number; // 0-100
  communication: number; // 0-100
}

// Category scores with detailed explanations
export interface CategoryScore {
  score: number; // 0-100
  explanation: string;
  strengths: string[];
  areas_for_improvement: string[];
}

export interface CategoryScores {
  technical?: CategoryScore;
  behavioral?: CategoryScore;
  cultural_fit?: CategoryScore;
  communication?: CategoryScore;
  leadership?: CategoryScore;
  problem_solving?: CategoryScore;
  [key: string]: CategoryScore | undefined;
}

// Evaluation sources tracking
export interface EvaluationSources {
  resume: boolean;
  interview: boolean;
  previous_evaluations: boolean;
  technical_assessment?: boolean;
  portfolio?: boolean;
}

// Main AI Evaluation interface
export interface AIEvaluation {
  id: string;
  candidateId: string;
  jobId: string;
  profileId: string;
  
  // Overall results
  overallScore: number; // 0-100
  overallStatus: EvaluationStatus;
  recommendation: RecommendationType;
  
  // Detailed explanations
  evaluationSummary: string;
  evaluationExplanation: string;
  
  // Radar chart data
  radarMetrics: RadarMetrics;
  
  // Category breakdowns
  categoryScores: CategoryScores;
  
  // Key insights
  keyStrengths: string[];
  areasForImprovement: string[];
  redFlags: string[];
  
  // Metadata
  evaluationSources: EvaluationSources;
  processingDurationMs: number;
  aiModelVersion: string;
  evaluationVersion: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Team Assessment interface (for manual evaluations by team members)
export interface TeamAssessment {
  id: string;
  candidateId: string;
  jobId: string;
  aiEvaluationId?: string;
  
  // Assessor information
  assessorProfileId: string;
  assessorName: string;
  assessorRole: string; // "Human Resources", "Engineering Manager", etc.
  
  // Assessment results
  overallRating: number; // 0.0 to 5.0 (e.g., 4.5)
  overallRatingStatus: EvaluationStatus;
  
  // Category ratings (matching radar metrics but as 0-5 scale)
  categoryRatings: {
    technical?: number;
    communication?: number;
    culture_fit?: number;
    leadership?: number;
    problem_solving?: number;
    [key: string]: number | undefined;
  };
  
  // Comments and feedback
  assessmentComments?: string;
  privateNotes?: string;
  
  // Assessment context
  assessmentType: AssessmentType;
  interviewDurationMinutes?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Evaluation Analytics interface
export interface EvaluationAnalytics {
  id: string;
  jobId: string;
  profileId: string;
  
  // Aggregated statistics
  totalCandidates: number;
  totalAiEvaluations: number;
  totalTeamAssessments: number;
  
  // Score distributions
  scoreDistribution: {
    '0-20': number;
    '21-40': number;
    '41-60': number;
    '61-80': number;
    '81-100': number;
  };
  avgOverallScore: number;
  avgTeamRating: number;
  
  // Category averages
  avgRadarMetrics: RadarMetrics;
  
  // Recommendation distribution
  recommendationDistribution: {
    strong_yes: number;
    yes: number;
    maybe: number;
    no: number;
    strong_no: number;
  };
  
  // Timestamps
  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Combined evaluation data (AI + Team assessments) for display
export interface CombinedEvaluation {
  aiEvaluation: AIEvaluation;
  teamAssessments: TeamAssessment[];
  analytics?: EvaluationAnalytics;
  
  // Computed values for display
  computedValues: {
    averageTeamRating: number;
    teamAssessmentStatus: EvaluationStatus;
    totalAssessors: number;
    consensusLevel: 'high' | 'medium' | 'low'; // Agreement between AI and team
    finalRecommendation: RecommendationType;
  };
}

// API Response types
export interface AIEvaluationResponse {
  success: boolean;
  evaluation: AIEvaluation;
  error?: string;
}

export interface TeamAssessmentResponse {
  success: boolean;
  assessment: TeamAssessment;
  error?: string;
}

export interface CombinedEvaluationResponse {
  success: boolean;
  combinedEvaluation: CombinedEvaluation;
  error?: string;
}

export interface EvaluationAnalyticsResponse {
  success: boolean;
  analytics: EvaluationAnalytics;
  error?: string;
}

// Request types for creating evaluations
export interface CreateAIEvaluationRequest {
  candidateId: string;
  jobId: string;
  includeResume?: boolean;
  includeInterview?: boolean;
  includePreviousEvaluations?: boolean;
}

export interface CreateTeamAssessmentRequest {
  candidateId: string;
  jobId: string;
  aiEvaluationId?: string;
  overallRating: number;
  categoryRatings: Record<string, number>;
  assessmentComments?: string;
  privateNotes?: string;
  assessmentType: AssessmentType;
  interviewDurationMinutes?: number;
}

// Utility types for UI components
export interface EvaluationSummaryCard {
  overallScore: number;
  overallStatus: EvaluationStatus;
  teamRating: number;
  teamStatus: EvaluationStatus;
  recommendation: RecommendationType;
}

export interface RadarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    pointBackgroundColor: string;
  }[];
}

// Status utility functions type
export interface EvaluationStatusUtils {
  getStatusColor: (status: EvaluationStatus) => string;
  getStatusLabel: (status: EvaluationStatus) => string;
  getRecommendationColor: (recommendation: RecommendationType) => string;
  getRecommendationLabel: (recommendation: RecommendationType) => string;
  computeStatusFromScore: (score: number) => EvaluationStatus;
  computeTeamRatingStatus: (rating: number) => EvaluationStatus;
}

// Filter and search types
export interface EvaluationFilters {
  jobId?: string;
  overallStatus?: EvaluationStatus[];
  recommendation?: RecommendationType[];
  minScore?: number;
  maxScore?: number;
  hasTeamAssessments?: boolean;
  assessorRole?: string;
  dateRange?: {
    start: string;
    end: string;
  };
} 