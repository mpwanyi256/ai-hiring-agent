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

    // Fetch all user subscriptions with related data
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select(
        `
        id,
        profile_id,
        status,
        current_period_start,
        current_period_end,
        trial_start,
        trial_end,
        cancel_at_period_end,
        stripe_customer_id,
        stripe_subscription_id,
        created_at,
        updated_at,
        profiles!inner(
          id,
          email,
          first_name,
          last_name,
          companies(
            name
          )
        ),
        subscriptions!inner(
          name
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    // Transform the data to a more usable format
    const transformedSubscriptions =
      subscriptions?.map((sub) => ({
        id: sub.id,
        profile_id: sub.profile_id,
        user_name:
          sub.profiles.first_name && sub.profiles.last_name
            ? `${sub.profiles.first_name} ${sub.profiles.last_name}`
            : 'No Name',
        user_email: sub.profiles.email,
        company_name: sub.profiles.companies?.name || null,
        subscription_name: sub.subscriptions.name,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        trial_start: sub.trial_start,
        trial_end: sub.trial_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: sub.stripe_subscription_id,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
      })) || [];

    return NextResponse.json({
      subscriptions: transformedSubscriptions,
      total: transformedSubscriptions.length,
    });
  } catch (error) {
    console.error('Error in admin user subscriptions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
