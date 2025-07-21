import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  selectIntegrations,
  selectIntegrationsLoading,
} from '@/store/integrations/integrationsSelectors';
import { disconnectIntegration, fetchIntegrations } from '@/store/integrations/integrationsThunks';
import { Integration, IntegrationProvider } from '@/types/integrations';
import Button from '../ui/Button';
import Image from 'next/image';
import { integrationService } from '@/lib/services/integrationService';

const PROVIDER_ICONS: Record<IntegrationProvider, React.ReactNode> = {
  google: (
    <Image src="/illustrations/google_calendar.svg" alt="Google Calendar" width={48} height={48} />
  ),
  slack: <Image src="/illustrations/slack.svg" alt="Slack" width={48} height={48} />,
  discord: <Image src="/illustrations/discord.svg" alt="Discord" width={48} height={48} />,
};

const PROVIDER_DESCRIPTIONS: Record<IntegrationProvider, string> = {
  google: 'Connect your Google Calendar to automatically create interview events with Meet links.',
  slack: 'Connect your Slack workspace to get notifications about new messages.',
  discord: 'Connect your Discord server to get notifications about new messages.',
};

const PROVIDER_NAMES: Record<IntegrationProvider, string> = {
  google: 'Google Calendar',
  slack: 'Slack',
  discord: 'Discord',
};

export default function ConnectedAccountsTab() {
  const dispatch = useAppDispatch();
  const integrations = useAppSelector(selectIntegrations) as Integration[];
  const loading = useAppSelector(selectIntegrationsLoading);

  useEffect(() => {
    dispatch(fetchIntegrations());
  }, [dispatch]);

  const states: Record<string, boolean> = {
    google: !!integrations.find((i) => i.provider === 'google'),
    slack: !!integrations.find((i) => i.provider === 'slack'),
    discord: !!integrations.find((i) => i.provider === 'discord'),
  };

  return (
    <div className="w-full max-w-3xl pl-0 pr-8">
      {/* Integrations List */}
      <div className="divide-y divide-gray-100 bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading integrations...</div>
        ) : (
          ['google', 'slack', 'discord'].map((provider) => (
            <div key={provider} className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                {PROVIDER_ICONS[provider as IntegrationProvider]}
                <div>
                  <div className="font-medium text-gray-900 capitalize">
                    {PROVIDER_NAMES[provider as IntegrationProvider]}
                  </div>
                  <div className="text-sm text-gray-500">
                    {PROVIDER_DESCRIPTIONS[provider as IntegrationProvider]}
                  </div>
                </div>
              </div>
              {states[provider] ? (
                <Button
                  variant="secondary"
                  onClick={() => dispatch(disconnectIntegration(provider as IntegrationProvider))}
                  size="sm"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => integrationService.connect(provider as IntegrationProvider)}
                >
                  Connect
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
