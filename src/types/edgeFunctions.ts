export interface AiCandidateEvaluationPayload {
  candidateId: string;
  jobId: string;
}

export interface AiCandidateEvaluationResponse {
  success: boolean;
  message: string;
  candidateId: string;
  jobId: string;
  status: string;
}
