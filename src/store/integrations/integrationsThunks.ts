import { ApiResponse } from '@/types';
import { Integration, IntegrationProvider } from '@/types/integrations';
import { apiUtils } from '../api';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { integrationService } from '@/lib/services/integrationService';

export const fetchIntegrations = createAsyncThunk<Integration[]>(
  'integrations/fetchIntegrations',
  async () => {
    const { data, error } = await apiUtils.get<ApiResponse<Integration[]>>('/api/integrations');
    if (error) throw error;
    return data || [];
  },
);

export const disconnectIntegration = createAsyncThunk<IntegrationProvider, IntegrationProvider>(
  'integrations/disconnectIntegration',
  async (provider: IntegrationProvider) => {
    let response;
    if (provider === 'google') {
      response = await integrationService.disconnectGoogle();
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    if (response.error) throw response.error;
    return provider;
  },
);
