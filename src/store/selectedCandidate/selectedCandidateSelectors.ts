import { RootState } from '@/store';

export const selectSelectedCandidate = (state: RootState) => state.selectedCandidate.candidate;
export const selectSelectedCandidateId = (state: RootState) =>
  state.selectedCandidate.candidate?.id;
