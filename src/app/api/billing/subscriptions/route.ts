import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionPlan } from '@/types/billing';
import { APIResponse } from '@/types';

export async function GET(_: NextRequest): Promise<NextResponse<APIResponse<SubscriptionPlan[]>>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly');

    if (error) {
      throw error;
    }

    return NextResponse.json<APIResponse<SubscriptionPlan[]>>({ data, success: true });
  } catch (error) {
    return NextResponse.json<APIResponse<SubscriptionPlan[]>>(
      { error: error instanceof Error ? error.message : 'Unknown error', success: false, data: [] },
      { status: 500 },
    );
  }
}
