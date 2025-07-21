import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { integrations } from '@/lib/constants';

const stripe = new Stripe(integrations.stripe.secretKey!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { returnUrl } = body;

    console.log('Creating billing portal session...');

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get user's subscription data from user_details view
    const { data: userDetails, error: userError } = await supabase
      .from('user_details')
      .select('stripe_customer_id, subscription_status, subscription_id')
      .eq('id', user.id)
      .maybeSingle();

    if (userError || !userDetails) {
      console.error('Error fetching user details:', userError);
      return NextResponse.json({ error: 'User details not found' }, { status: 404 });
    }

    // Check if user has an active subscription
    if (!userDetails.subscription_id || !userDetails.subscription_status) {
      console.error('No active subscription found for user:', user.id);
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Check if subscription is active or trialing
    if (!['active', 'trialing'].includes(userDetails.subscription_status)) {
      console.error(
        'Subscription not active for user:',
        user.id,
        'Status:',
        userDetails.subscription_status,
      );
      return NextResponse.json({ error: 'Subscription not active' }, { status: 404 });
    }

    // Check if user has a Stripe customer ID
    if (!userDetails.stripe_customer_id) {
      console.error('No Stripe customer ID found for user:', user.id);
      return NextResponse.json(
        { error: 'Billing portal not available. Please contact support.' },
        { status: 404 },
      );
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userDetails.stripe_customer_id,
      return_url: returnUrl || `${request.nextUrl.origin}/dashboard/billing`,
    });

    console.log('Billing portal session created:', session.id);

    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);

    // Check if it's a configuration error
    if (error.code === 'resource_missing' || error.message?.includes('customer')) {
      return NextResponse.json(
        {
          error: 'Billing portal not configured. Please contact support.',
          needsConfiguration: true,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create billing portal session' },
      { status: 500 },
    );
  }
}
