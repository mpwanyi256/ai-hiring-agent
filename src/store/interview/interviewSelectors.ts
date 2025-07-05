import { RootState } from "@/store";
import { createSelector } from "@reduxjs/toolkit";

export const selectInterview = (state: RootState) => state.interview;

export const selectIsLoading = createSelector(
  [selectInterview],
  (interview) => interview.isLoading
)

export const selectError = createSelector(
  [selectInterview],
  (interview) => interview.error
)

export const selectInterviewStep = createSelector(
  [selectInterview],
  (interview) => interview.interviewStep
)

export const loadedInterview = createSelector(
  [selectInterview],
  (interview) => interview.interview
)

export const selectCandidate = createSelector(
  [selectInterview],
  (interview) => interview.candidate
)
