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
      return null;
    }
  }
  return accessToken;
}
