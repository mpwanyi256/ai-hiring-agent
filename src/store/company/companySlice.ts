import { createSlice } from '@reduxjs/toolkit';
import { CompanyState } from '@/types/company';
import { fetchCompanyData, fetchCompanyJobsBySlug } from './companyThunks';

const initialState: CompanyState = {
  company: null,
  loading: false,
  jobs: [],
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
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
