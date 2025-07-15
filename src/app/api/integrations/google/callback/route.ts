import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { integrations } from '@/lib/constants';

const GOOGLE_CLIENT_ID = integrations.google.clientId!;
const GOOGLE_CLIENT_SECRET = integrations.google.clientSecret!;
const GOOGLE_REDIRECT_URI = integrations.google.redirectUri!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  console.log('Google callback response', searchParams);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `/dashboard/settings?google=error&message=${encodeURIComponent(error)}`,
    );
  }
  if (!code) {
    return NextResponse.redirect('/dashboard/settings?google=error&message=Missing+code');
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
  } catch (err) {
    return NextResponse.redirect('/dashboard/settings?google=error&message=Token+exchange+failed');
  }

  // Get user info from Google
  oauth2Client.setCredentials(tokens);
  let googleUser;
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    googleUser = data;
  } catch (err) {
    return NextResponse.redirect(
      '/dashboard/settings?google=error&message=Failed+to+fetch+user+info',
    );
  }

  // Get current user from Supabase session
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.redirect('/dashboard/settings?google=error&message=Not+authenticated');
  }

  // Get user's company_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_id')
    .eq('id', user.id)
    .single();
  if (!profile) {
    return NextResponse.redirect('/dashboard/settings?google=error&message=Profile+not+found');
  }

  // Upsert integration
  const { error: upsertError } = await supabase.from('integrations').upsert(
    {
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
    },
    { onConflict: 'company_id,provider' },
  );

  if (upsertError) {
    return NextResponse.redirect(
      '/dashboard/settings?google=error&message=Failed+to+save+integration',
    );
  }

  return NextResponse.redirect('/dashboard/settings?google=success');
}
