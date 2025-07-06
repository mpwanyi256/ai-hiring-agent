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

export interface CandidateBasic {
  id: string;
  candidate_info_id: string;
  jobId: string;
  jobTitle: string;
  jobStatus: string;
  interviewToken: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  completionPercentage: number;
  responseCount: number;
  submittedAt: string | null;
  createdAt: string;
  evaluation: CandidateEvaluationSummary | null;
  resume: CandidateResume | null;
}

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

export interface CandidateDetailed extends CandidateBasic {
  job: {
    id: string;
    title: string;
    status: string;
    fields: Record<string, any>;
    interviewFormat: 'text' | 'video';
  };
  responses: CandidateResponse[];
  evaluation: CandidateEvaluationDetailed | null;
  stats: CandidateStats;
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
export interface Candidate {
  id: string;
  jobId: string;
  interviewToken: string;
  email?: string;
  submittedAt?: string;
  evaluation?: Evaluation;
  responses?: Response[];
  resume?: CandidateResume;
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
  email?: string;
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
