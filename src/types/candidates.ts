export interface Candidate {
  id: string;
  jobId: string;
  interviewToken: string;
  email?: string;
  submittedAt?: string;
  evaluation?: Evaluation;
  responses?: Response[];
}

export interface Response {
  id: string;
  candidateId: string;
  question: string;
  answer: string;
}

export interface Evaluation {
  id: string;
  candidateId: string;
  summary: string;
  score: number;
  strengths: string[];
  redFlags: string[];
}

export interface CandidatesState {
  candidates: Candidate[];
  currentCandidate: Candidate | null;
  isLoading: boolean;
  error: string | null;
  totalCandidates: number;
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
} 