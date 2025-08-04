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

    // Get notification preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (preferencesError && preferencesError.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', preferencesError);
      return NextResponse.json(
        { error: 'Failed to fetch notification preferences' },
        { status: 500 },
      );
    }

    // If no preferences exist, return default preferences structure
    if (!preferences) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      const defaultPreferences = {
        user_id: user.id,
        company_id: profile?.company_id || '',
        email_enabled: true,
        email_job_applications: true,
        email_interview_scheduled: true,
        email_interview_reminders: true,
        email_candidate_updates: true,
        email_system_updates: true,
        email_marketing: false,
        push_enabled: true,
        push_job_applications: true,
        push_interview_scheduled: true,
        push_interview_reminders: true,
        push_candidate_updates: true,
        in_app_enabled: true,
        in_app_job_applications: true,
        in_app_interview_scheduled: true,
        in_app_candidate_updates: true,
        in_app_system_updates: true,
        email_digest_frequency: 'daily' as const,
        quiet_hours_start: '22:00:00',
        quiet_hours_end: '08:00:00',
      };

      return NextResponse.json(defaultPreferences);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in notification preferences GET:', error);
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

    // Get user's company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Upsert notification preferences
    const { data: preferences, error: upsertError } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          company_id: profile.company_id,
          ...body,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Error updating notification preferences:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update notification preferences' },
        { status: 500 },
      );
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in notification preferences PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
