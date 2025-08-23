import { Button } from '@/components/ui/button';
import { IntegrationProvider } from '@/types/integrations';
import Image from 'next/image';
import { integrationService } from '@/lib/services/integrationService';
import { useState } from 'react';
import { ConnectProviderModal } from '@/components/ui/ConnectProviderModal';
import { trackProviderConnection } from '@/lib/analytics/tracking';

interface ConnectProviderProps {
  name: string;
  icon: string;
  color: string;
}

const providersConfig: Record<IntegrationProvider, ConnectProviderProps> = {
  google: {
    name: 'Google',
    icon: '/illustrations/google_calendar.svg',
    color: '#4285F4',
  },
  slack: {
    name: 'Slack',
    icon: '/illustrations/slack.svg',
    color: '#000000',
  },
  discord: {
    name: 'Discord',
    icon: '/illustrations/discord.svg',
    color: '#000000',
  },
};

export const ConnectProviderButton = ({ provider }: { provider: IntegrationProvider }) => {
  const [isOpen, setIsOpen] = useState(false);
  const config = providersConfig[provider];

  const handleConnect = async () => {
    try {
      // Track successful connection
      trackProviderConnection(provider, 'success');

      // Call the integration service
      await integrationService.connect(provider);
    } catch (error) {
      // Track failed connection
      trackProviderConnection(provider, 'failed');
      console.error('Failed to connect provider:', error);
    }
  };

  return (
    <>
      <Button variant="outline" className="text-xs" size="sm" onClick={() => setIsOpen(true)}>
        <Image src={config.icon} alt={config.name} width={20} height={20} />
        {`Connect your ${config.name} account`}
      </Button>

      <ConnectProviderModal
        provider={provider}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConnect={handleConnect}
      />
    </>
  );
};
