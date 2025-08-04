import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserSubscription } from '@/types/billing';
import { APIResponse } from '@/types';
import { AppRequestParams } from '@/types/api';

export async function GET(
  _: NextRequest,
  { params }: AppRequestParams<{ userId: string }>,
): Promise<NextResponse<APIResponse<UserSubscription | null>>> {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    if (!userId) {
      return NextResponse.json<APIResponse<UserSubscription | null>>(
        { error: 'Missing required params', success: false, data: null },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(
        `
          *,
          subscriptions (
            name,
            description,
            max_jobs,
            max_interviews_per_month
          )
        `,
      )
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return NextResponse.json<APIResponse<UserSubscription | null>>({ data, success: true });
  } catch (error) {
    return NextResponse.json<APIResponse<UserSubscription | null>>(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        data: null,
      },
      { status: 500 },
    );
  }
}
