import { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';
import { EvaluationState } from './evaluationSlice';

// Basic selectors
export const selectEvaluation = (state: RootState): EvaluationState => state.evaluation;

// Resume evaluation selectors
export const selectCurrentResumeEvaluation = (state: RootState) => 
  state.evaluation.currentResumeEvaluation;

export const selectResumeEvaluationLoading = (state: RootState) => 
  state.evaluation.resumeEvaluationLoading;

export const selectResumeEvaluationError = (state: RootState) => 
  state.evaluation.resumeEvaluationError;

// Interview evaluation selectors
export const selectCurrentInterviewEvaluation = (state: RootState) => 
  state.evaluation.currentInterviewEvaluation;

export const selectInterviewEvaluationLoading = (state: RootState) => 
  state.evaluation.interviewEvaluationLoading;

export const selectInterviewEvaluationError = (state: RootState) => 
  state.evaluation.interviewEvaluationError;

// Evaluation history selectors
export const selectEvaluationHistory = (state: RootState) => 
  state.evaluation.evaluationHistory;

export const selectHistoryLoading = (state: RootState) => 
  state.evaluation.historyLoading;

export const selectHistoryError = (state: RootState) => 
  state.evaluation.historyError;

// UI state selectors
export const selectIsUploading = (state: RootState) => 
  state.evaluation.isUploading;

export const selectUploadProgress = (state: RootState) => 
  state.evaluation.uploadProgress;

// Computed selectors
export const selectHasResumeEvaluation = createSelector(
  [selectCurrentResumeEvaluation],
  (evaluation) => evaluation !== null
);

export const selectHasInterviewEvaluation = createSelector(
  [selectCurrentInterviewEvaluation],
  (evaluation) => evaluation !== null
);

export const selectResumePassesThreshold = createSelector(
  [selectCurrentResumeEvaluation],
  (evaluation) => evaluation?.passesThreshold ?? false
);

export const selectCurrentEvaluationScore = createSelector(
  [selectCurrentInterviewEvaluation, selectCurrentResumeEvaluation],
  (interviewEval, resumeEval) => {
    if (interviewEval) return interviewEval.score;
    if (resumeEval) return resumeEval.score;
    return null;
  }
);

export const selectCurrentRecommendation = createSelector(
  [selectCurrentInterviewEvaluation, selectCurrentResumeEvaluation],
  (interviewEval, resumeEval) => {
    if (interviewEval) return interviewEval.recommendation;
    if (resumeEval) return resumeEval.recommendation;
    return null;
  }
);

// History analytics selectors
export const selectEvaluationsByType = createSelector(
  [selectEvaluationHistory],
  (history) => {
    const byType = {
      resume: history.filter(e => e.evaluationType === 'resume'),
      interview: history.filter(e => e.evaluationType === 'interview'),
      combined: history.filter(e => e.evaluationType === 'combined'),
    };
    return byType;
  }
);

export const selectEvaluationStats = createSelector(
  [selectEvaluationHistory],
  (history) => {
    const total = history.length;
    const averageScore = total > 0 ? 
      history.reduce((sum, e) => sum + (e.score || 0), 0) / total : 0;
    
    const recommendationCounts = history.reduce((acc, e) => {
      acc[e.recommendation] = (acc[e.recommendation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const highScores = history.filter(e => (e.score || 0) >= 80).length;
    const lowScores = history.filter(e => (e.score || 0) < 60).length;

    return {
      total,
      averageScore: Math.round(averageScore),
      recommendationCounts,
      highScores,
      lowScores,
      passRate: total > 0 ? Math.round(((total - lowScores) / total) * 100) : 0,
    };
  }
);

export const selectRecentEvaluations = createSelector(
  [selectEvaluationHistory],
  (history) => {
    return [...history]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }
);

export const selectTopCandidateEvaluations = createSelector(
  [selectEvaluationHistory],
  (history) => {
    return [...history]
      .filter(e => e.score && e.score >= 70)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10);
  }
);

// Loading state selectors
export const selectAnyEvaluationLoading = createSelector(
  [selectResumeEvaluationLoading, selectInterviewEvaluationLoading, selectHistoryLoading],
  (resumeLoading, interviewLoading, historyLoading) => 
    resumeLoading || interviewLoading || historyLoading
);

export const selectAnyEvaluationError = createSelector(
  [selectResumeEvaluationError, selectInterviewEvaluationError, selectHistoryError],
  (resumeError, interviewError, historyError) => 
    resumeError || interviewError || historyError
);

// Filter selectors (for use with components)
export const makeSelectEvaluationsByJob = () => createSelector(
  [selectEvaluationHistory, (state: RootState, jobId: string) => jobId],
  (history, jobId) => history.filter(e => e.jobId === jobId)
);

export const makeSelectEvaluationsByScore = () => createSelector(
  [selectEvaluationHistory, (state: RootState, minScore: number) => minScore],
  (history, minScore) => history.filter(e => (e.score || 0) >= minScore)
);

export const makeSelectEvaluationsByRecommendation = () => createSelector(
  [selectEvaluationHistory, (state: RootState, recommendation: string) => recommendation],
  (history, recommendation) => history.filter(e => e.recommendation === recommendation)
);

// Combined evaluation selector for displaying complete candidate profile
export const selectCombinedEvaluation = createSelector(
  [selectCurrentResumeEvaluation, selectCurrentInterviewEvaluation],
  (resumeEval, interviewEval) => {
    if (!resumeEval && !interviewEval) return null;

    const combinedScore = (() => {
      if (resumeEval && interviewEval) {
        // Weight: 30% resume, 70% interview
        return Math.round((resumeEval.score * 0.3) + (interviewEval.score * 0.7));
      }
      return resumeEval?.score || interviewEval?.score || 0;
    })();

    const combinedRecommendation = (() => {
      if (interviewEval) return interviewEval.recommendation;
      if (resumeEval) return resumeEval.recommendation === 'proceed' ? 'yes' : 'no';
      return 'no';
    })();

    return {
      resumeEvaluation: resumeEval,
      interviewEvaluation: interviewEval,
      combinedScore,
      combinedRecommendation,
      hasResume: !!resumeEval,
      hasInterview: !!interviewEval,
      isComplete: !!(resumeEval && interviewEval),
    };
  }
); 