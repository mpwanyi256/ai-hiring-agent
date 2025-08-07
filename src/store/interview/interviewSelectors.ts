import { RootState } from '@/store';
import { createSelector } from '@reduxjs/toolkit';

export const selectInterview = (state: RootState) => state.interview;

export const selectIsLoading = createSelector(
  [selectInterview],
  (interview) => interview.isLoading,
);

export const selectError = createSelector([selectInterview], (interview) => interview.error);

export const selectInterviewStep = createSelector(
  [selectInterview],
  (interview) => interview.interviewStep,
);

export const loadedInterview = createSelector(
  [selectInterview],
  (interview) => interview.interview,
);

export const selectCandidate = createSelector(
  [selectInterview],
  (interview) => interview.candidate,
);

export const selectInterviewCompany = createSelector(
  [selectInterview],
  (interview) => interview.company,
);

export const selectInterviewConflicts = createSelector(
  [selectInterview],
  (interview) => interview.conflicts,
);

export const selectInterviewQuestions = createSelector(
  [selectInterview],
  (interview) => interview.interviewQuestions,
);

export const selectIsQuestionsLoading = createSelector(
  [selectInterview],
  (interview) => interview.isQuestionsLoading,
);

export const selectInterviewQuestionResponses = createSelector(
  [selectInterview],
  (interview) => interview.interviewQuestionResponses,
);

export const selectSavingResponse = createSelector(
  [selectInterview],
  (interview) => interview.savingResponse,
);
