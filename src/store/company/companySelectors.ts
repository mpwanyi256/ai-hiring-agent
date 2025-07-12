import { RootState } from '@/store';

export const selectCompany = (state: RootState) => state.company.company;
export const selectCompanyLoading = (state: RootState) => state.company.loading;
