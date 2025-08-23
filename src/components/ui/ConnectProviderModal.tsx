import { Button } from '@/components/ui/button';
import { IntegrationProvider } from '@/types/integrations';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowRightLeft } from 'lucide-react';

interface ConnectProviderModalProps {
  provider: IntegrationProvider;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => void;
}

interface ProviderConfig {
  name: string;
  icon: string;
  color: string;
  description: string;
}

const providersConfig: Record<IntegrationProvider, ProviderConfig> = {
  google: {
    name: 'Google',
    icon: '/illustrations/google_calendar.svg',
    color: '#fff',
    description:
      'Connect your Google account to sync calendar events and manage interviews seamlessly.',
  },
  slack: {
    name: 'Slack',
    icon: '/illustrations/slack.svg',
    color: '#000000',
    description:
      'Connect your Slack workspace to receive notifications and collaborate with your team.',
  },
  discord: {
    name: 'Discord',
    icon: '/illustrations/discord.svg',
    color: '#000000',
    description:
      'Connect your Discord server to receive notifications and collaborate with your team.',
  },
};

export const ConnectProviderModal = ({
  provider,
  isOpen,
  onOpenChange,
  onConnect,
}: ConnectProviderModalProps) => {
  const config = providersConfig[provider];

  const handleConnect = () => {
    onConnect();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Dotted background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <DialogHeader>
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-6">
              {/* App Logo */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center shadow-lg">
                <Image
                  src="/images/logo.png"
                  alt="Intavia"
                  width={32}
                  height={32}
                  className="filter brightness-0 invert"
                />
              </div>

              {/* Connection line with dots */}
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <ArrowRightLeft className="w-4 h-4 bg-green-500 rounded-full text-white" />
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
              </div>

              {/* Provider Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: config.color }}
              >
                <Image src={config.icon} alt={config.name} width={50} height={50} />
              </div>
            </div>
          </div>

          <DialogTitle className="text-center text-xl font-semibold text-gray-800">
            {config.name} access needed
          </DialogTitle>
          <DialogDescription className="text-center text-base text-sm text-gray-600 leading-relaxed">
            Hey, we noticed you haven&apos;t granted Intavia access to your {config.name} account
            yet. Click below to enable access and start{' '}
            {provider === 'google' ? 'capturing interviews' : 'collaborating with your team'}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 relative z-10">
          <Button
            onClick={handleConnect}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
            size="lg"
          >
            Allow access to my {config.name} account
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            Not now
          </Button>
          <p className="text-xs text-gray-500 text-center">
            You can manage your connected accounts in{' '}
            <a href="/dashboard/settings" className="text-green-600 hover:underline">
              settings page
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
