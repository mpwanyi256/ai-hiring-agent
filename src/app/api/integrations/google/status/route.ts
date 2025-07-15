import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  // Find the user's Google integration
  const { data: integration, error } = await supabase
    .from('integrations')
    .select('id, provider, access_token, expires_at, metadata')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch integration' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, integration });
}
