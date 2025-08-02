import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { integrations } from '@/lib/constants';

export async function getValidGoogleAccessToken({
  userId,
  companyId,
}: {
  userId: string;
  companyId: string;
}) {
  const supabase = await createClient();
  // Fetch integration
  const { data: integration } = await supabase
    .from('integrations')
    .select('id, access_token, refresh_token, expires_at, provider')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('provider', 'google')
    .maybeSingle();
  if (!integration) return null;

  const now = Date.now();
  const expiresAt = integration.expires_at ? new Date(integration.expires_at).getTime() : 0;
  let accessToken = integration.access_token;

  // If expired and refresh_token exists, refresh
  if (expiresAt && expiresAt < now && integration.refresh_token) {
    const oauth2Client = new google.auth.OAuth2(
      integrations.google.clientId!,
      integrations.google.clientSecret!,
      integrations.google.redirectUri!,
    );
    oauth2Client.setCredentials({ refresh_token: integration.refresh_token });
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      accessToken = credentials.access_token!;
      // Update DB with new token/expiry
      await supabase
        .from('integrations')
        .update({
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : null,
        })
        .eq('id', integration.id);
    } catch (err) {
      console.error('Failed to refresh Google access token:', err);

      // If refresh token is invalid (invalid_grant), mark integration as disconnected
      if (err instanceof Error && err.message.includes('invalid_grant')) {
        console.log('Refresh token invalid, marking integration as disconnected');
        await supabase
          .from('integrations')
          .update({
            access_token: null,
            refresh_token: null,
            expires_at: null,
            status: 'disconnected',
          })
          .eq('id', integration.id);
      }

      return null;
    }
  }
  return accessToken;
}

/**
 * Check if Google integration is properly connected and has valid tokens
 */
export async function isGoogleIntegrationConnected({
  userId,
  companyId,
}: {
  userId: string;
  companyId: string;
}): Promise<boolean> {
  const supabase = await createClient();

  const { data: integration } = await supabase
    .from('integrations')
    .select('id, access_token, refresh_token, status')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('provider', 'google')
    .maybeSingle();

  if (!integration) return false;

  // Check if integration is marked as disconnected or missing tokens
  if (integration.status === 'disconnected' || !integration.refresh_token) {
    return false;
  }

  return true;
}

/**
 * Mark Google integration as disconnected (for use when auth fails)
 */
export async function markGoogleIntegrationDisconnected({
  userId,
  companyId,
}: {
  userId: string;
  companyId: string;
}): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('integrations')
    .update({
      access_token: null,
      refresh_token: null,
      expires_at: null,
      status: 'disconnected',
    })
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('provider', 'google');
}
