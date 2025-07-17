import { createSlice } from '@reduxjs/toolkit';
import { CompanyState } from '@/types/company';
import { fetchCompanyData, fetchCompanyJobsBySlug, fetchTimezones } from './companyThunks';
import { apiError } from '@/lib/notification';

const initialState: CompanyState = {
  company: null,
  loading: false,
  jobs: [],
  error: null,
  isUpdating: false,
  isUploadingLogo: false,
  timezones: [],
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchTimezones.fulfilled, (state, action) => {
      state.timezones = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchTimezones.rejected, () => {
      apiError('Failed to fetch timezones');
    });
    builder.addCase(fetchCompanyData.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCompanyData.fulfilled, (state, action) => {
      state.company = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchCompanyData.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(fetchCompanyJobsBySlug.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCompanyJobsBySlug.fulfilled, (state, action) => {
      state.jobs = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchCompanyJobsBySlug.rejected, (state) => {
      state.loading = false;
    });
  },
});

// export const { } = companySlice.actions;
export default companySlice.reducer;
