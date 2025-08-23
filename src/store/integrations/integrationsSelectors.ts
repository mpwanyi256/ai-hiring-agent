import { RootState } from '..';
import { IntegrationProvider } from '@/types/integrations';

export {
  selectIntegrations,
  selectIntegrationsLoading,
  selectIntegrationsError,
} from './integrationsSlice';

export const IntegrationByProvider = (provider: IntegrationProvider) => {
  return (state: RootState) => {
    return state.integrations.integrations.find((integration) => integration.provider === provider);
  };
};
