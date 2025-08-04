import { NextRequest, NextResponse } from 'next/server';
import { AppRequestParams } from '@/types/api';
import { createClient } from '@/lib/supabase/server';
import { APIResponse, UserSubscription } from '@/types';

// TODO: Refactor this to fetch company subscription details
export async function GET(
  request: NextRequest,
  { params }: AppRequestParams<{ userId: string }>,
): Promise<NextResponse<APIResponse<UserSubscription | null>>> {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    if (!userId) {
      return NextResponse.json<APIResponse<UserSubscription | null>>(
        { success: false, error: 'User ID is required', data: null },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    const subscription: UserSubscription = {
      id: data.subscription_id,
      user_id: userId,
      subscription_id: data.subscription_id,
      status: data.subscription_status,
      started_at: data.subscription_started_at || new Date().toISOString(),
      expires_at: data.subscription_expires_at,
      current_period_start: data.subscription_started_at,
      current_period_end: data.subscription_expires_at,
      trial_start: undefined, // Not available in user_details
      trial_end: undefined, // Not available in user_details
      cancel_at_period_end: false, // Not available in user_details
      stripe_customer_id: data.stripe_customer_id,
      stripe_subscription_id: data.stripe_subscription_id,
      created_at: data.user_created_at,
      updated_at: data.user_updated_at,
      subscriptions: {
        id: data.subscription_id,
        name: data.subscription_name,
        description: data.subscription_description,
        price_monthly: data.price_monthly,
        price_yearly: data.price_yearly,
        max_jobs: data.max_jobs,
        max_interviews_per_month: data.max_interviews_per_month,
        features: data.subscription_features,
        trial_days: 14, // Default trial days
        interval: 'month',
        is_active: true,
        stripe_product_id: data.stripe_product_id || '',
        stripe_price_id_dev: data.stripe_price_id_dev || '',
        stripe_price_id_prod: data.stripe_price_id_prod || '',
        stripe_price_id_dev_yearly: data.stripe_price_id_dev_yearly || '',
        stripe_price_id_prod_yearly: data.stripe_price_id_prod_yearly || '',
        stripe_checkout_link_dev: data.stripe_checkout_link_dev || '',
        stripe_checkout_link_prod: data.stripe_checkout_link_prod || '',
        stripe_checkout_link_dev_yearly: data.stripe_checkout_link_dev_yearly || '',
        stripe_checkout_link_prod_yearly: data.stripe_checkout_link_prod_yearly || '',
        created_at: data.company_created_at,
        updated_at: data.user_updated_at,
      },
    };

    return NextResponse.json<APIResponse<UserSubscription>>({
      success: true,
      data: subscription,
    });
  } catch {
    return NextResponse.json<APIResponse<UserSubscription | null>>(
      { success: false, error: 'Something went wrong. Please try again later.', data: null },
      { status: 500 },
    );
  }
}
