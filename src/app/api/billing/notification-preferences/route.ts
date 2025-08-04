import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BillingNotificationPreferences } from '@/types/billing';

interface BillingNotificationPreferencesWithUserId extends BillingNotificationPreferences {
  user_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const preferences: BillingNotificationPreferencesWithUserId = await request.json();

    if (!preferences.user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('billing_notification_preferences')
      .upsert(preferences, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error('Notification preferences update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
