import { apiUtils } from '@/store/api';
import { ApiResponse } from '@/types';
import { apiError } from '../notification';
import { IntegrationProvider } from '@/types/integrations';

class IntegrationService {
  async disconnectGoogle(): Promise<ApiResponse<null>> {
    const response = await apiUtils.delete<ApiResponse<null>>(
      '/api/integrations/google/disconnect',
    );
    return response;
  }

  async connect(provider: IntegrationProvider) {
    if (provider === 'google') {
      window.location.href = '/api/integrations/google/connect';
    } else {
      apiError(`${provider} integration is not supported yet.`);
    }
  }
}

export const integrationService = new IntegrationService();
