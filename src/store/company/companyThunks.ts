import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '..';
import { apiUtils } from '../api';
import { Company } from '@/types/company';
import { APIResponse } from '@/types';
import { JobData } from '@/lib/services/jobsService';
import { UpdateCompanyData } from '@/types/company';

export const fetchCompanyJobsBySlug = createAsyncThunk<
  JobData[],
  string,
  {
    rejectValue: string;
  }
>('company/fetchCompanyJobsBySlug', async (slug, { rejectWithValue }) => {
  const response = await apiUtils.get<APIResponse<JobData[]>>(`/api/company/slug/${slug}/jobs`);
  if (response.error) return rejectWithValue(response.error);
  return response.data;
});

export const fetchCompanyBySlug = createAsyncThunk<
  Company,
  string,
  {
    rejectValue: string;
  }
>('company/fetchCompanyBySlug', async (slug, { rejectWithValue }) => {
  const response = await apiUtils.get<APIResponse<Company>>(`/api/company/slug/${slug}`);
  if (response.error) return rejectWithValue(response.error);
  return response.data;
});

// Fetch company data
export const fetchCompanyData = createAsyncThunk(
  'company/fetchCompanyData',
  async (_, { rejectWithValue, getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;
    if (!user?.companyId) return rejectWithValue('Sorry, you are not associated with any company');

    try {
      const response = await fetch(`/api/company?company_id=${user.companyId}`);
      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch company data');
      }

      return data.company;
    } catch {
      return rejectWithValue('Failed to fetch company data');
    }
  },
);

// Update company details
export const updateCompanyDetails = createAsyncThunk(
  'company/updateCompanyDetails',
  async (updateData: UpdateCompanyData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to update company details');
      }

      return data.company;
    } catch {
      return rejectWithValue('Failed to update company details');
    }
  },
);

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

// Upload company logo
export const uploadCompanyLogo = createAsyncThunk(
  'company/uploadCompanyLogo',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/company/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to upload logo');
      }

      return data.logoUrl;
    } catch {
      return rejectWithValue('Failed to upload logo');
    }
  },
);
