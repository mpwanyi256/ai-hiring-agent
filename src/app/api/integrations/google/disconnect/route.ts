import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE() {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the Google integration for this user
    const { error: deleteError } = await supabase
      .from('integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google');

    if (deleteError) {
      console.error('Error disconnecting Google integration:', deleteError);
      return NextResponse.json({ error: 'Failed to disconnect Google Calendar' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Google Calendar disconnected successfully',
    });
  } catch (error) {
    console.error('Error in Google disconnect:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
