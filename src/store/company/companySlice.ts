import { createSlice } from '@reduxjs/toolkit';
import { CompanyState } from '@/types/company';
import { fetchCompanyData } from './companyThunks';

const initialState: CompanyState = {
  company: null,
  loading: false,
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
  },
});

// export const { } = companySlice.actions;
export default companySlice.reducer;
