// Candidate Management Types

import { UserRole } from '@/types/jobs';

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

export interface AIAssesment {
  score: number;
  strengths: string[];
  explanation: string;
  areas_for_improvement: string[];
}

export interface SkillsAssessment {
  [key: string]: AIAssesment;
}

export interface Candidate {
  id: string;
  jobId: string;
  jobTitle: string;
  jobStatus: string;
  interviewToken: string;
  candidateInfoId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  progress: number;
  responses: number;
  status: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  candidateStatus: CandidateStatus;
  evaluation: {
    id: string;
    score: number;
    recommendation: string;
    summary: string;
    strengths: string[];
    redFlags: string[];
    skillsAssessment: SkillsAssessment;
    traitsAssessment: {
      skills: number;
      culture: number;
      team_work: number;
      communication: number;
      growth_mindset: number;
    };
    createdAt: string;
    resumeScore: number;
    resumeSummary: string;
    evaluationType: string;
  };
  resume: {
    id: string;
    filename: string;
    filePath: string;
    publicUrl: string;
    fileSize: number;
    fileType: string;
    wordCount: number;
    parsingStatus: string;
    parsingError: string | null;
    uploadedAt: string;
  };
}

export type CandidateBasic = Omit<Candidate, 'evaluation' | 'resume'>;

// New type for candidates returned by the API that includes evaluation
export interface CandidateWithEvaluation extends Omit<Candidate, 'evaluation' | 'resume'> {
  interviewDetails: {
    calendar_event_id: string | null;
    created_at: string;
    date: string;
    duration: number;
    id: string;
    meet_link: string | null;
    notes: string;
    status: string;
    time: string;
    timezone_id: string;
    updated_at: string;
  } | null;
  evaluation: {
    id: string;
    score: number;
    recommendation: RecommendationType;
    summary: string;
    strengths: string[];
    redFlags: string[];
    createdAt: string;
  } | null;
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
  | 'all'
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
  jobTitle: string;
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
  orderIndex: number;
  questionType: string;
  questionText: string;
  responseText: string;
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
  shortlistedCandidates: CandidateWithEvaluation[];
  currentCandidate: InterviewingCandidate | null;
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
    currentEvaluation: AIEvaluationResponse | null;
  };
  // Candidate responses state
  candidateResponses: {
    [candidateId: string]: {
      responses: CandidateResponse[];
      isLoading: boolean;
      error: string | null;
    };
  };
}

export interface CandidatesResponse {
  candidates: Candidate[];
}

export interface CandidateListResponse {
  candidates: Candidate[];
  job: { id: string; title: string };
  pagination: {
    hasMore: boolean;
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
  stats: {
    averageScore: number;
    completed: number;
    inProgress: number;
    pending: number;
    total: number;
  };
  success: boolean;
}

export interface TeamAssesment {
  id: string;
  candidateId: string;
  jobId: string;
  aiEvaluationId: string;
  assessorProfileId: string;
  assessorName: string;
  assessorRole: UserRole;
  overallRating: number;
  overallRatingStatus: string;
  categoryRatings: Record<string, number>;
  assessmentComments: string;
  privateNotes: string;
  assessmentType: string;
  interviewDurationMinutes: number;
  createdAt: string;
  updatedAt: string;
  assessorProfile: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface AIEvaluationResponse {
  success: boolean;
  aiEvaluation: AIEvaluation | null;
  teamAssessments: TeamAssesment[];
  computedValues: {
    averageTeamRating: number;
    totalAssessors: number;
    consensusLevel: 'high' | 'medium' | 'low';
    finalRecommendation: RecommendationType;
  };
  candidateInfo: {
    id: string;
    jobId: string;
    jobTitle: string;
    firstName: string;
    lastName: string;
    email: string;
    currentStep: number;
    totalSteps: number;
    isCompleted: boolean;
  };
}

export interface ShortlistResponse {
  success: boolean;
  message: string;
}

export interface ResumeResponse {
  resume: unknown;
}

export interface EvaluationResponse {
  evaluations: unknown[];
}

export interface CreateCandidateResponse {
  candidate: unknown;
}

export interface SubmitInterviewResponse {
  candidate: unknown;
}

export interface SaveEvaluationResponse {
  evaluation: unknown;
}

export interface UpdateEvaluationResponse {
  evaluation: unknown;
}

export interface GenerateAIEvaluationResponse {
  evaluation: unknown;
}

export interface CandidateResponse {
  id: string;
  questionId: string;
  questionText: string | undefined;
  questionType: string | undefined;
  responseText: string;
  responseTime: number;
  orderIndex: number | undefined;
  createdAt: string;
}

export interface CandidateResponsesResponse {
  responses: CandidateResponse[];
}

export interface TeamAssessmentResponse {
  assessment: unknown;
}

export interface FetchCandidatesByJobIdPayload {
  jobId: string;
  search?: string;
  minScore?: number;
  maxScore?: number;
  status?: CandidateStatusFilter;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  candidateStatus?: CandidateStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InterviewingCandidate {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateInfoId: string;
  interviewToken: string;
  email: string;
  firstName: string;
  full_name: string;
  lastName: string;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidatePayload {
  jobToken: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface GetShortlistedCandidatesPayload {
  jobId: string;
  status?: CandidateStatus[];
  search?: string;
  page: number;
  limit: number;
}

export interface ShortlistedCandidatesResponse {
  success: boolean;
  candidates: CandidateWithEvaluation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
