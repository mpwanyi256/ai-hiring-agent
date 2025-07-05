import { RootState } from "@/store";
import { createSelector } from "@reduxjs/toolkit";

export const selectInterview = (state: RootState) => state.interview;

export const selectJob = createSelector(
  [selectInterview],
  (interview) => interview.job
)

export const selectIsLoading = createSelector(
  [selectInterview],
  (interview) => interview.isLoading
)

export const selectError = createSelector(
  [selectInterview],
  (interview) => interview.error
)