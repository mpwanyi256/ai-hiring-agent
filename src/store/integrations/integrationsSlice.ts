import { createSlice } from '@reduxjs/toolkit';
import { Integration } from '@/types/integrations';
import { RootState } from '../index';

import { fetchIntegrations, disconnectIntegration } from './integrationsThunks';

export interface IntegrationsState {
  integrations: Integration[];
  loading: boolean;
  error: string | null;
}

const initialState: IntegrationsState = {
  integrations: [],
  loading: false,
  error: null,
};

const integrationsSlice = createSlice({
  name: 'integrations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIntegrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIntegrations.fulfilled, (state, action) => {
        state.loading = false;
        state.integrations = action.payload;
      })
      .addCase(fetchIntegrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch integrations';
      })
      .addCase(disconnectIntegration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(disconnectIntegration.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.integrations = state.integrations.filter(
          (integration) => integration.provider !== payload,
        );
      })
      .addCase(disconnectIntegration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to disconnect integration';
      });
  },
});

export const selectIntegrations = (state: RootState) => state.integrations.integrations;
export const selectIntegrationsLoading = (state: RootState) => state.integrations.loading;
export const selectIntegrationsError = (state: RootState) => state.integrations.error;

export default integrationsSlice.reducer;
