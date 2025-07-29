import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/Loading';
import { apiSuccess, apiError } from '@/lib/notification';

interface Integration {
  id: string;
  provider: string;
  access_token: string;
  expires_at: string | null;
  metadata: {
    email?: string;
    name?: string;
  };
}

export default function GoogleCalendarIntegration() {
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch('/api/integrations/google/status');
      const data = await response.json();
      if (data.success && data.integration) {
        setIntegration(data.integration);
      } else {
        setIntegration(null);
      }
    } catch {
      apiError('Failed to fetch Google Calendar integration status');
      setIntegration(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        'Are you sure you want to disconnect Google Calendar? This will remove all calendar integration features.',
      )
    ) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch('/api/integrations/google/disconnect', {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setIntegration(null);
        apiSuccess('Google Calendar disconnected successfully');
        setStatus('success');
        setMessage('Google Calendar disconnected successfully');
      } else {
        apiError(data.error || 'Failed to disconnect Google Calendar');
        setStatus('error');
        setMessage(data.error || 'Failed to disconnect Google Calendar');
      }
    } catch (error) {
      console.log('Error disconnecting Google Calendar:', error);
      apiError('Failed to disconnect Google Calendar');
      setStatus('error');
      setMessage('Failed to disconnect Google Calendar');
    } finally {
      setDisconnecting(false);
    }
  };

  useEffect(() => {
    // Check for OAuth status in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'success') {
      setStatus('success');
      setMessage('Google Calendar connected successfully!');
      apiSuccess('Google Calendar connected successfully!');
      // Refresh integration status after successful connection
      fetchIntegrationStatus();
    } else if (params.get('google') === 'error') {
      setStatus('error');
      setMessage(params.get('message') || 'Failed to connect Google Calendar');
      apiError(params.get('message') || 'Failed to connect Google Calendar');
    } else {
      // Fetch integration status
      fetchIntegrationStatus();
    }
  }, []);

  if (loading) {
    return <Loading message="Checking Google Calendar integration..." />;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-xl">
      <h3 className="text-lg font-semibold mb-2">Google Calendar Integration</h3>
      {integration ? (
        <div className="flex flex-col gap-4">
          <div className="text-green-700 font-medium flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
            Connected as <span className="font-semibold">{integration.metadata.email}</span>
          </div>
          {integration.expires_at && (
            <div className="text-xs text-gray-500">
              Token expires at: {new Date(integration.expires_at).toLocaleString()}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/api/integrations/google/connect';
              }}
            >
              Reconnect
            </Button>
            <Button variant="secondary" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="text-gray-600">
            Connect your Google Calendar to automatically create interview events with Meet links.
          </div>
          <Button
            variant="primary"
            onClick={() => {
              window.location.href = '/api/integrations/google/connect';
            }}
          >
            Connect Google Calendar
          </Button>
        </div>
      )}
      {status !== 'idle' && message && (
        <div className={`mt-4 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
