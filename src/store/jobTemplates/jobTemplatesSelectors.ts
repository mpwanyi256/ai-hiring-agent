import { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';
import { JobTemplate } from '@/types/jobs';

// Basic selectors
export const selectJobTemplates = (state: RootState) => state.jobTemplates;
export const selectJobTemplatesData = (state: RootState) => state.jobTemplates.templates;
export const selectJobTemplatesLoading = (state: RootState) => state.jobTemplates.isLoading;
export const selectJobTemplatesError = (state: RootState) => state.jobTemplates.error;
export const selectJobTemplatesLastFetched = (state: RootState) => state.jobTemplates.lastFetched;

// Memoized selectors
export const selectActiveJobTemplates = createSelector(
  [selectJobTemplatesData],
  (templates: JobTemplate[]) => templates.filter((template: JobTemplate) => template.name)
);

export const selectJobTemplatesCount = createSelector(
  [selectJobTemplatesData],
  (templates: JobTemplate[]) => templates.length
);

export const selectJobTemplateById = createSelector(
  [selectJobTemplatesData, (state: RootState, templateId: string) => templateId],
  (templates: JobTemplate[], templateId: string) => templates.find(template => template.id === templateId)
);

export const selectJobTemplatesByFormat = createSelector(
  [selectJobTemplatesData, (state: RootState, format: string) => format],
  (templates: JobTemplate[], format: string) => templates.filter(template => template.interview_format === format)
); 