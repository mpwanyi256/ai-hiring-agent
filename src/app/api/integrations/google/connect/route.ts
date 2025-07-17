import { NextResponse } from 'next/server';
import { integrations } from '@/lib/constants';

const GOOGLE_CLIENT_ID = integrations.google.clientId!;
const GOOGLE_REDIRECT_URI = integrations.google.redirectUri!;
const SCOPE =
  'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

export async function GET() {
  // Optionally generate a state param for CSRF protection
  const state = Math.random().toString(36).substring(2);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPE,
    state,
  });
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(googleAuthUrl);
}
