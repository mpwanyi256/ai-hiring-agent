import { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';

// Basic selectors
export const selectCandidates = (state: RootState) => state.candidates;
export const selectCandidatesList = (state: RootState) => state.candidates.candidates;
export const selectCurrentCandidate = (state: RootState) => state.candidates.currentCandidate;
export const selectCandidatesLoading = (state: RootState) => state.candidates.isLoading;
export const selectCandidatesError = (state: RootState) => state.candidates.error;
export const selectTotalCandidates = (state: RootState) => state.candidates.totalCandidates;

// Memoized selectors
export const selectSubmittedCandidates = createSelector(
  [selectCandidatesList],
  (candidates) => candidates.filter(candidate => candidate.submittedAt)
);

export const selectPendingCandidates = createSelector(
  [selectCandidatesList],
  (candidates) => candidates.filter(candidate => !candidate.submittedAt)
);

export const selectEvaluatedCandidates = createSelector(
  [selectCandidatesList],
  (candidates) => candidates.filter(candidate => candidate.evaluation)
);

export const selectUnevaluatedCandidates = createSelector(
  [selectCandidatesList],
  (candidates) => candidates.filter(candidate => candidate.submittedAt && !candidate.evaluation)
);

export const selectCandidateById = createSelector(
  [selectCandidatesList, (state: RootState, candidateId: string) => candidateId],
  (candidates, candidateId) => candidates.find(candidate => candidate.id === candidateId)
);

export const selectCandidatesByScore = createSelector(
  [selectEvaluatedCandidates],
  (candidates) => {
    return [...candidates]
      .filter(candidate => candidate.evaluation)
      .sort((a, b) => (b.evaluation?.score || 0) - (a.evaluation?.score || 0));
  }
);

export const selectTopCandidates = createSelector(
  [selectCandidatesByScore],
  (candidates) => candidates.slice(0, 5)
);

export const selectCandidateStats = createSelector(
  [selectCandidatesList],
  (candidates) => {
    const submitted = candidates.filter(c => c.submittedAt);
    const evaluated = candidates.filter(c => c.evaluation);
    const pending = candidates.filter(c => !c.submittedAt);
    
    const scores = evaluated.map(c => c.evaluation?.score || 0).filter(s => s > 0);
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const highScorers = evaluated.filter(c => (c.evaluation?.score || 0) >= 80).length;

    return {
      total: candidates.length,
      submitted: submitted.length,
      pending: pending.length,
      evaluated: evaluated.length,
      unevaluated: submitted.length - evaluated.length,
      averageScore: Math.round(averageScore * 10) / 10,
      highScorers,
      conversionRate: candidates.length > 0 ? Math.round((submitted.length / candidates.length) * 100) : 0,
    };
  }
);

export const selectCandidateResponses = createSelector(
  [selectCurrentCandidate],
  (candidate) => {
    if (!candidate || !candidate.responses) return [];
    return candidate.responses;
  }
);

export const selectCandidateEvaluation = createSelector(
  [selectCurrentCandidate],
  (candidate) => {
    return candidate?.evaluation || null;
  }
);

export const selectCandidatesForJob = createSelector(
  [selectCandidatesList, (state: RootState, jobId: string) => jobId],
  (candidates, jobId) => candidates.filter(candidate => candidate.jobId === jobId)
);

export const selectRecentCandidates = createSelector(
  [selectCandidatesList],
  (candidates) => {
    return [...candidates]
      .filter(candidate => candidate.submittedAt)
      .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())
      .slice(0, 10);
  }
);

export const selectCandidateScoreDistribution = createSelector(
  [selectEvaluatedCandidates],
  (candidates) => {
    const scores = candidates.map(c => c.evaluation?.score || 0);
    const ranges = {
      excellent: scores.filter(s => s >= 90).length,
      good: scores.filter(s => s >= 70 && s < 90).length,
      average: scores.filter(s => s >= 50 && s < 70).length,
      poor: scores.filter(s => s < 50).length,
    };
    
    return ranges;
  }
); 