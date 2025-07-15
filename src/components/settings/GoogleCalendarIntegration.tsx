import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
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
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for OAuth status in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'success') {
      setStatus('success');
      setMessage('Google Calendar connected successfully!');
      apiSuccess('Google Calendar connected successfully!');
    } else if (params.get('google') === 'error') {
      setStatus('error');
      setMessage(params.get('message') || 'Failed to connect Google Calendar');
      apiError(params.get('message') || 'Failed to connect Google Calendar');
    }
    // Fetch integration status
    fetch('/api/integrations/google/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.integration) {
          setIntegration(data.integration);
        } else {
          setIntegration(null);
        }
      })
      .catch(() => setIntegration(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loading message="Checking Google Calendar integration..." />;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-xl">
      <h3 className="text-lg font-semibold mb-2">Google Calendar Integration</h3>
      {integration ? (
        <div className="flex flex-col gap-2">
          <div className="text-green-700 font-medium flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
            Connected as <span className="font-semibold">{integration.metadata.email}</span>
          </div>
          {integration.expires_at && (
            <div className="text-xs text-gray-500">
              Token expires at: {new Date(integration.expires_at).toLocaleString()}
            </div>
          )}
          {/* Optionally add a Disconnect button here */}
        </div>
      ) : (
        <Button
          variant="primary"
          onClick={() => {
            window.location.href = '/api/integrations/google/connect';
          }}
        >
          Connect Google Calendar
        </Button>
      )}
      {status !== 'idle' && message && (
        <div className={`mt-4 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
