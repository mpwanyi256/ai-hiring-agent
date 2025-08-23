import { Button } from '@/components/ui/button';
import { IntegrationProvider } from '@/types/integrations';
import Image from 'next/image';
import { integrationService } from '@/lib/services/integrationService';

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
  const config = providersConfig[provider];
  return (
    <Button
      variant="outline"
      className="text-xs"
      size="sm"
      onClick={() => {
        integrationService.connect(provider);
      }}
    >
      <Image src={config.icon} alt={config.name} width={20} height={20} />
      {`Connect your ${config.name} account`}
    </Button>
  );
};
