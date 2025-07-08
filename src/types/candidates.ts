// Candidate Management Types

// Resume information interface
export interface CandidateResume {
  id: string;
  filename: string;
  filePath: string;
  publicUrl: string;
  fileSize: number;
  fileType: string;
  wordCount: number | null;
  parsingStatus: 'pending' | 'success' | 'failed';
  parsingError: string | null;
  uploadedAt: string;
}

// AI Evaluation Types
export interface AIEvaluation {
  id: string;
  candidateId: string;
  summary: string;
  score: number;
  strengths: string[];
  redFlags: string[];
  skillsAssessment: Record<string, number>;
  traitsAssessment: Record<string, number>;
  recommendation: RecommendationType;
  feedback: string;
  processingDurationMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamAssessment {
  id: string;
  candidateId: string;
  evaluatorId: string;
  evaluatorName: string;
  score: number;
  feedback: string;
  createdAt: string;
}

export type CandidateInterviewStatus = 'in_progress' | 'completed' | 'pending';

// Enhanced Candidate interface with all properties
export interface Candidate {
  id: string;
  jobId: string;
  jobTitle: string;
  jobStatus: string;
  interviewToken: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  progress: number;
  responses: number;
  status: CandidateInterviewStatus;
  submittedAt: string;
  createdAt: string;
  resumeScore: number;
  candidateStatus?: CandidateStatus;
  evaluation?: Evaluation;
  resume?: CandidateResume;
}

export type CandidateBasic = Omit<Candidate, 'evaluation' | 'resume'>;

export interface CandidateEvaluationSummary {
  id: string;
  score: number;
  recommendation: RecommendationType;
  summary: string;
  strengths: string[];
  redFlags: string[];
  createdAt: string;
  resumeScore?: number;
  resumeSummary?: string;
  evaluationType?: 'resume' | 'interview' | 'combined';
}

export interface CandidateDetailed {
  job: {
    id: string;
    title: string;
    status: string;
    fields: Record<string, any>;
    interviewFormat: string;
  };
  responses: {
    id: string;
    questionId: string;
    question: string;
    answer: string;
    responseTime: number;
    createdAt: string;
  }[];
  evaluation: CandidateEvaluationDetailed | null;
  stats: {
    totalQuestions: number;
    answeredQuestions: number;
    averageResponseTime: number;
    totalInterviewTime: number;
    completionPercentage: number;
  };
}

export interface CandidateResponse {
  id: string;
  questionId: string;
  question: string;
  answer: string;
  responseTime: number; // in seconds
  createdAt: string;
}

export interface CandidateEvaluationDetailed {
  id: string;
  summary: string;
  score: number;
  strengths: string[];
  redFlags: string[];
  skillsAssessment: Record<string, any>;
  traitsAssessment: Record<string, any>;
  recommendation: RecommendationType;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
  resumeScore?: number;
  resumeSummary?: string;
  evaluationType?: 'resume' | 'interview' | 'combined';
}

export interface CandidateStats {
  totalQuestions: number;
  answeredQuestions: number;
  averageResponseTime: number; // in seconds
  totalInterviewTime: number; // in seconds
  completionPercentage: number;
}

export type RecommendationType = 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';

export type CandidateStatusFilter = 'all' | 'completed' | 'in_progress';

// Database enum values - must match the PostgreSQL enum exactly
export type CandidateStatus =
  | 'under_review'
  | 'interview_scheduled'
  | 'shortlisted'
  | 'reference_check'
  | 'offer_extended'
  | 'offer_accepted'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

// API Response Types
export interface CandidatesListResponse {
  success: boolean;
  candidates: CandidateBasic[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    averageScore: number;
  };
  error?: string;
}

export interface CandidateDetailResponse {
  success: boolean;
  candidate: CandidateDetailed;
  error?: string;
}

// Resume download response
export interface ResumeDownloadResponse {
  success: boolean;
  resume: {
    id: string;
    filename: string;
    publicUrl: string;
    fileSize: number;
    fileType: string;
  } | null;
  error?: string;
}

// Search and Filter Types
export interface CandidateFilters {
  jobId?: string;
  status?: CandidateStatusFilter;
  search?: string;
  page?: number;
  limit?: number;
}

// Legacy types for backward compatibility - keeping existing structure
export interface CandidateList {
  id: string;
  jobId: string;
  interviewToken: string;
  email: string;
  submittedAt?: string;
  evaluation?: Evaluation;
  responses: number;
  resume?: CandidateResume;
  candidateStatus?: CandidateStatus;
  name: string;
  score?: number;
  progress: number;
  resumeScore?: number;
  createdAt: string;
  status: CandidateInterviewStatus;
}

export interface Response {
  id: string;
  candidateId: string;
  question: string;
  answer: string;
  responseTime: number;
  createdAt: string;
}

export interface Evaluation {
  id: string;
  candidateId: string;
  summary: string;
  score: number;
  strengths: string[];
  redFlags: string[];
  recommendation: RecommendationType;
  feedback?: string;
  skillsAssessment?: Record<string, any>;
  traitsAssessment?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  resumeScore?: number;
  resumeSummary?: string;
  evaluationType?: 'resume' | 'interview' | 'combined';
}

export interface CreateCandidateData {
  jobId: string;
  interviewToken: string;
  email: string;
}

export interface SubmitInterviewData {
  candidateId: string;
  responses: { question: string; answer: string }[];
}

// Types for Supabase response data
export interface SupabaseResponse {
  id: string;
  candidate_id: string;
  question: string;
  answer: string;
  response_time: number;
  created_at: string;
}

export interface getCandidateDetailsPayload {
  jobToken: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface CandidateStatusOptions {
  value: CandidateStatus;
  label: string;
  color: string;
}

// Redux State Types
export interface CandidatesState {
  candidates: Candidate[];
  currentCandidate: Candidate | null;
  isLoading: boolean;
  error: string | null;
  totalCandidates: number;
  jobCandidatesStats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    averageScore: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  // AI evaluation state
  aiEvaluation: {
    isEvaluating: boolean;
    evaluatingCandidateId: string | null;
    lastEvaluationDuration: number | null;
    isLoadingEvaluation: boolean;
    currentEvaluation: {
      candidateId: string | null;
      aiEvaluation: AIEvaluation | null;
      teamAssessments: TeamAssessment[];
      computedValues: Record<string, unknown>;
    } | null;
  };
  // Candidate responses state
  candidateResponses: {
    [candidateId: string]: {
      responses: Response[];
      isLoading: boolean;
      error: string | null;
    };
  };
}
