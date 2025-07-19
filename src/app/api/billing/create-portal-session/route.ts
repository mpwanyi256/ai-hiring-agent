import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { integrations } from '@/lib/constants';

const stripe = new Stripe(integrations.stripe.secretKey!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { returnUrl } = await request.json();

    if (!returnUrl) {
      return NextResponse.json({ success: false, error: 'Missing return URL' }, { status: 400 });
    }

    // Get user's Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 },
      );
    }

    try {
      // Create billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: returnUrl,
      });

      return NextResponse.json({
        success: true,
        data: {
          url: session.url,
        },
      });
    } catch (stripeError: any) {
      console.error('Stripe billing portal error:', stripeError);

      // Check if it's a configuration error
      if (
        stripeError.code === 'invalid_request_error' &&
        stripeError.message?.includes('configuration')
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Billing portal not configured. Please contact support to manage your subscription.',
            needsConfiguration: true,
          },
          { status: 503 },
        );
      }

      // For other Stripe errors, return a generic message
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to access billing portal at this time. Please try again later.',
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create billing portal session' },
      { status: 500 },
    );
  }
}
