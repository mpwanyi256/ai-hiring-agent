import { RootState } from '@/store';

export const selectCompany = (state: RootState) => state.company.company;
export const selectCompanyLoading = (state: RootState) => state.company.loading;
export const selectCompanyJobs = (state: RootState) => state.company.jobs;
