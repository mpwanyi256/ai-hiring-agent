import { RootState } from '@/store';

export const selectSelectedCandidate = (state: RootState) => state.selectedCandidate.candidate;
export const selectSelectedCandidateId = (state: RootState) =>
  state.selectedCandidate.candidate?.id;
export const selectSelectedCandidateResumeStats = (state: RootState) =>
  state.selectedCandidate.candidate?.resume;
export const selectSelectedCandidateEvaluation = (state: RootState) =>
  state.selectedCandidate.candidate?.evaluation;

export const selectSelectedCandidateAnalytics = (state: RootState) =>
  state.selectedCandidate.candidateAnalytics;
