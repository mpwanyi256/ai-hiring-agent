import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user from Supabase session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Delete the Google integration for this user
    const { error: deleteError } = await supabase
      .from('integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google');

    if (deleteError) {
      console.error('Error disconnecting Google integration:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to disconnect integration' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Google integration disconnected successfully',
    });
  } catch (error) {
    console.error('Error in disconnect Google integration:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
