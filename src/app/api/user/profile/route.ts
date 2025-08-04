import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    // Get user profile with company ownership info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        first_name,
        last_name,
        avatar_url,
        company_id,
        companies!inner(created_by)
      `,
      )
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const userProfile = {
      id: profile.id,
      email: user.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      avatar_url: profile.avatar_url,
      email_verified: user.email_confirmed_at ? true : false,
      company_id: profile.company_id,
      is_company_owner: (profile.companies as any)?.created_by === profile.id,
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { firstName, lastName } = body;

    const updates: any = {};

    // Only allow updating first name and last name
    if (firstName !== undefined) {
      updates.first_name = firstName;
    }

    if (lastName !== undefined) {
      updates.last_name = lastName;
    }

    // Update profile in the database
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error in profile update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
