import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Fetch all users with their profile information and last sign in data
    const { data: users, error } = await supabase
      .from('profiles')
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        role,
        avatar_url,
        company_id,
        created_at,
        updated_at,
        companies!inner(
          name
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get last sign in data from auth.users table
    // Note: This requires service role key to access auth schema
    const { data: authUsers, error: authError2 } = await supabase.auth.admin.listUsers();

    if (authError2) {
      console.error('Error fetching auth users:', authError2);
      // Continue without last sign in data if we can't access it
    }

    // Merge profile data with auth data
    const usersWithActivity =
      users?.map((user) => {
        const authUser = authUsers?.users.find((au) => au.id === user.id);
        return {
          ...user,
          company_name: user.companies?.name || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
        };
      }) || [];

    // Remove the nested companies object to clean up the response
    const cleanUsers = usersWithActivity.map(({ companies, ...user }) => user);

    return NextResponse.json({
      users: cleanUsers,
      total: cleanUsers.length,
    });
  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
