import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '..';
import { apiUtils } from '../api';
import { ClientCompany } from '@/types/company';
import { APIResponse } from '@/types';

export const fetchCompanyData = createAsyncThunk<
  ClientCompany,
  void,
  {
    rejectValue: string;
  }
>('company/fetchCompanyData', async (_, { getState, rejectWithValue }) => {
  console.log('Fetching company data');
  const state = getState() as RootState;
  const user = state.auth.user;

  if (!user?.companyId) return rejectWithValue('Sorry, you are not associated with any company');

  const response = await apiUtils.get<APIResponse<ClientCompany>>(`/api/company/${user.companyId}`);
  if (response.error) return rejectWithValue(response.error);
  return response.data;
});
