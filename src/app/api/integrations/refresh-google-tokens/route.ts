import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Initialize Supabase client
const supabase = createServiceRoleClient();

export async function GET(req: NextRequest) {
  try {
    // Fetch token status from the provider-agnostic view
    const { data: allProviderStatus, error: allProviderError } = await supabase
      .from('provider_token_status')
      .select('*');

    if (allProviderError) {
      console.error('Error fetching all provider token status:', allProviderError);
      return NextResponse.json(
        { success: false, error: allProviderError.message },
        { status: 500 },
      );
    }

    // Fetch Google-specific token status from the view (for backward compatibility)
    const { data: googleStatus, error: googleStatusError } = await supabase
      .from('google_token_status')
      .select('*');

    if (googleStatusError) {
      console.error('Error fetching Google token status:', googleStatusError);
      return NextResponse.json(
        { success: false, error: googleStatusError.message },
        { status: 500 },
      );
    }

    // Fetch details of expiring tokens for all providers
    const { data: expiringTokens, error: expiringError } = await supabase.rpc(
      'get_expiring_tokens_summary',
    );

    if (expiringError) {
      console.error('Error fetching expiring tokens summary:', expiringError);
      return NextResponse.json({ success: false, error: expiringError.message }, { status: 500 });
    }

    // Fetch Google-specific expiring tokens (for backward compatibility)
    const { data: expiringGoogleTokens, error: expiringGoogleError } = await supabase.rpc(
      'get_expiring_google_tokens_summary',
    );

    if (expiringGoogleError) {
      console.error('Error fetching expiring Google tokens summary:', expiringGoogleError);
      return NextResponse.json(
        { success: false, error: expiringGoogleError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      allProviders: {
        status: allProviderStatus,
        summary: expiringTokens,
      },
      google: {
        status: googleStatus,
        summary: expiringGoogleTokens,
      },
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Call the manual refresh function in Supabase
    const { data, error } = await supabase.rpc('manual_refresh_google_tokens');

    if (error) {
      console.error('Error manually refreshing Google tokens:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
