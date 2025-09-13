import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the current user to verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Use the user_details view which has comprehensive user information
    const { data: userDetails, error } = await supabase
      .from('user_details')
      .select('*')
      .order('user_created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user details:', error);
      return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
    }

    // user_details view now includes last_sign_in_at from auth.users
    const cleanUsers = userDetails || [];

    return NextResponse.json({
      users: cleanUsers,
      total: cleanUsers.length,
    });
  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
