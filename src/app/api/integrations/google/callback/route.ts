import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { integrations } from '@/lib/constants';

const GOOGLE_CLIENT_ID = integrations.google.clientId!;
const GOOGLE_CLIENT_SECRET = integrations.google.clientSecret!;
const GOOGLE_REDIRECT_URI = integrations.google.redirectUri!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Get the base URL from the request
  const baseUrl = request.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?google=error&message=${encodeURIComponent(error)}`,
    );
  }
  if (!code) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?google=error&message=Missing+code`);
  }

  // Exchange code for tokens
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );
  let tokens;
  try {
    const { tokens: tokenResult } = await oauth2Client.getToken(code);
    tokens = tokenResult;
  } catch (_err) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?google=error&message=Token+exchange+failed`,
    );
  }

  // Get user info from Google
  oauth2Client.setCredentials(tokens);
  let googleUser;
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    googleUser = data;
  } catch (_err) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?google=error&message=Failed+to+fetch+user+info`,
    );
  }

  // Get current user from Supabase session
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?google=error&message=Not+authenticated`,
    );
  }

  // Get user's company_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_id')
    .eq('id', user.id)
    .single();
  if (!profile) {
    console.error('Profile not found for user:', user.id);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?google=error&message=Profile+not+found`,
    );
  }

  // Check if integration already exists
  const { data: existingIntegration, error: checkError } = await supabase
    .from('integrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .maybeSingle();

  if (checkError) {
    console.error('Error checking existing integration:', checkError);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?google=error&message=Failed+to+check+existing+integration`,
    );
  }

  const integrationData = {
    company_id: profile.company_id,
    user_id: user.id,
    provider: 'google',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    scope: tokens.scope,
    metadata: {
      email: googleUser.email,
      google_id: googleUser.id,
      name: googleUser.name,
    },
    updated_at: new Date().toISOString(),
  };

  let saveError;
  if (existingIntegration) {
    // Update existing integration
    const { error } = await supabase
      .from('integrations')
      .update(integrationData)
      .eq('id', existingIntegration.id);
    saveError = error;
  } else {
    // Insert new integration
    const { error } = await supabase.from('integrations').insert(integrationData);
    saveError = error;
  }

  if (saveError) {
    console.error('Failed to save integration:', saveError);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?google=error&message=Failed+to+save+integration`,
    );
  }

  return NextResponse.redirect(`${baseUrl}/dashboard/settings?google=success`);
}
