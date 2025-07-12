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

export const updateCompanyDetails = createAsyncThunk<
  ClientCompany,
  Partial<ClientCompany>,
  {
    rejectValue: string;
  }
>('company/updateCompanyDetails', async (update, { getState, rejectWithValue }) => {
  const state = getState() as RootState;
  const user = state.auth.user;
  if (!user?.companyId) return rejectWithValue('Sorry, you are not associated with any company');
  const response = await apiUtils.put<APIResponse<ClientCompany>>(
    `/api/company/${user.companyId}`,
    update,
  );
  if (response.error) return rejectWithValue(response.error);
  return response.data;
});

export const deleteCompanyLogo = createAsyncThunk<
  void,
  void,
  {
    rejectValue: string;
  }
>('company/deleteCompanyLogo', async (_, { getState, rejectWithValue }) => {
  const state = getState() as RootState;
  const user = state.auth.user;
  const company = state.company.company;
  if (!user?.companyId || !company?.logo_path)
    return rejectWithValue('Sorry, you are not associated with any company');
  const response = await apiUtils.delete<APIResponse<void>>(
    `/api/company/${company.id}/upload-logo?logo_path=${company.logo_path}`,
  );
  if (response.error) return rejectWithValue(response.error);
  return response.data;
});

export const uploadCompanyLogo = createAsyncThunk<
  { url: string; path: string },
  File,
  {
    rejectValue: string;
  }
>('company/uploadCompanyLogo', async (file, { getState, rejectWithValue, dispatch }) => {
  const state = getState() as RootState;
  const user = state.auth.user;
  if (!user?.companyId) return rejectWithValue('Sorry, you are not associated with any company');
  const formData = new FormData();
  formData.append('file', file);

  // first delete the old logo
  await dispatch(deleteCompanyLogo());

  const response = await fetch(`/api/company/${user.companyId}/upload-logo`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok || !data.url) return rejectWithValue(data.error || 'Failed to upload logo');

  await dispatch(updateCompanyDetails({ logo_url: data.url, logo_path: data.path }));

  return data;
});
