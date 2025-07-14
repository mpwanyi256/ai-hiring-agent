import { JobData } from '@/lib/services/jobsService';
import { CandidateBasic } from './candidates';
import { ClientCompany } from './company';

export interface JobQuestion {
  id: string;
  jobId: string;
  questionText: string;
  questionType: 'general' | 'technical' | 'behavioral' | 'experience' | 'custom';
  category: string;
  expectedDuration: number; // in seconds
  isRequired: boolean;
  orderIndex: number;
  isAiGenerated: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Legacy aliases for backward compatibility
export type InterviewQuestion = JobQuestion;

export interface JobQuestionDetailed extends JobQuestion {
  jobTitle: string;
  profileId: string;
  interviewFormat: 'text' | 'video';
  jobStatus: string;
  jobIsActive: boolean;
}

export interface CandidateProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string | null; // null for candidates
  role: 'candidate' | 'employer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

// Legacy alias for backward compatibility
export type Candidate = CandidateProfile & {
  jobId: string;
  interviewToken: string;
  submittedAt?: string;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
};

export interface CandidateResponse {
  id: string;
  profileId: string;
  jobId: string;
  jobQuestionId: string;
  question: string;
  answer: string;
  responseTime: number; // in seconds
  resumeText?: string; // stored for context
  createdAt: string;
}

export interface InterviewEvaluation {
  id: string;
  profileId: string;
  jobId: string;
  evaluationType: 'resume' | 'interview' | 'combined';
  summary: string;
  score: number; // 0-100
  resumeScore?: number; // 0-100 for resume evaluations
  resumeSummary?: string; // AI summary of resume evaluation
  resumeFilename?: string;
  strengths: string[];
  redFlags: string[];
  skillsAssessment: Record<string, number>; // skill -> score (0-10)
  traitsAssessment: Record<string, number>; // trait -> score (0-10)
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  feedback: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewSession {
  profileId: string;
  jobId: string;
  jobTitle: string;
  interviewToken: string;
  email: string;
  firstName: string;
  lastName: string;
  totalResponses: number;
  totalQuestions: number;
  completionPercentage: number;
  startedAt: string;
  lastResponseAt: string;
  isCompleted: boolean;
  totalTimeSpent: number;
}

// Enhanced session for active interviews
export interface ActiveInterviewSession {
  candidate: Candidate;
  questions: InterviewQuestion[];
  responses: CandidateResponse[];
  currentQuestionIndex: number;
  startedAt: string;
  timeElapsed: number;
}

export interface InterviewStats {
  totalQuestions: number;
  answeredQuestions: number;
  timeSpent: number;
  estimatedTimeRemaining: number;
  completionPercentage: number;
}

export interface ResumeUpload {
  file: File;
  content: string;
  filename: string;
}

export interface ResumeEvaluation {
  score: number; // 0-100
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  experienceMatch: 'under' | 'match' | 'over';
  recommendation: 'proceed' | 'reject';
  feedback: string;
  passesThreshold: boolean; // whether candidate can proceed to interview
}

export interface QuestionGenerationRequest {
  jobId: string;
  jobTitle: string;
  jobDescription?: string;
  skills?: string[];
  experienceLevel?: string;
  traits?: string[];
  customFields?: Record<string, any>;
  questionCount?: number;
  includeCustom?: boolean;
}

export interface QuestionGenerationResponse {
  questions: Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt'>[];
  totalGenerated: number;
  estimatedDuration: number; // total estimated interview duration
}

export interface InterviewState {
  interview: JobData | null;
  interviewStep: number;
  candidate: CandidateBasic | null;
  isLoading: boolean;
  error: string | null;
  company: Omit<ClientCompany, 'id'> | null;
}

export interface createCandidateAccountPayload {
  jobToken: string;
  email: string;
  firstName: string;
  lastName: string;
}

export type InterviewStep = 'intro' | 'info' | 'resume' | 'interview' | 'complete';

export interface InterviewCompletePayload {
  candidateId: string;
  jobToken: string;
  candidateInfo: {
    id: string;
    jobId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  resumeEvaluation: ResumeEvaluation;
  resumeContent: string;
  totalTimeSpent: number;
}
