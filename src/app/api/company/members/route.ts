import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.company_id) {
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 });
    }

    // Fetch all company members
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        role,
        created_at,
        updated_at
      `,
      )
      .eq('company_id', profile.company_id)
      .order('first_name', { ascending: true });

    if (membersError) {
      console.error('Members error:', membersError);
      return NextResponse.json({ error: 'Failed to fetch company members' }, { status: 500 });
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error('Error fetching company members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
