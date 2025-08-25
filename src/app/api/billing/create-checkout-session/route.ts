import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { app, integrations, isDev } from '@/lib/constants';

const stripe = new Stripe(integrations.stripe.secretKey!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, billingPeriod = 'monthly', userId } = body;

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and planId' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get user details to fetch email
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userProfile?.email) {
      console.error('Error fetching user profile:', userError);
      return NextResponse.json({ error: 'User not found or missing email' }, { status: 400 });
    }

    // Get plan details with current pricing
    const { data: planDetails, error: planError } = await supabase
      .from('subscriptions')
      .select('name, trial_days, price_monthly, price_yearly, currency, description')
      .eq('name', planId)
      .eq('is_active', true)
      .single();

    if (planError || !planDetails) {
      console.error('Error fetching plan details:', planError);
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
    }

    // Get the current price based on billing period
    const currentPrice =
      billingPeriod === 'yearly' ? planDetails.price_yearly : planDetails.price_monthly;
    const currency = planDetails.currency || 'usd';

    if (currentPrice === null || currentPrice === undefined) {
      console.error('No price configured for plan:', planId, 'billing period:', billingPeriod);
      return NextResponse.json(
        { error: 'Price not configured for this plan and billing period' },
        { status: 400 },
      );
    }

    // Log the pricing details for debugging
    console.log('Creating checkout session with dynamic pricing:', {
      planId,
      planName: planDetails.name,
      billingPeriod,
      currentPrice,
      currency,
      trialDays: planDetails.trial_days,
    });

    const userEmail = userProfile.email;
    const planName = planDetails.name;

    // Get or create Stripe customer
    let stripeCustomerId: string;

    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('profile_id', userId)
      .single();

    if (existingSubscription?.stripe_customer_id) {
      stripeCustomerId = existingSubscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create checkout session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `${planDetails.description || planName} Plan`,
              description: `${planDetails.description || planName} subscription (${billingPeriod})`,
            },
            unit_amount: Math.round(currentPrice * 100), // Convert to cents
            recurring: {
              interval: billingPeriod === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${app.baseUrl}/dashboard?success=true`,
      cancel_url: `${app.baseUrl}/pricing?canceled=true`,
      metadata: {
        userId: userId,
        planId: planName,
        billingPeriod: billingPeriod,
        price: currentPrice.toString(),
        currency: currency,
      },
      subscription_data: {
        trial_period_days: planDetails.trial_days || undefined,
        metadata: {
          userId: userId,
          planId: planName,
          billingPeriod: billingPeriod,
          price: currentPrice.toString(),
          currency: currency,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);

    // Provide more specific error messages for common issues
    let errorMessage = 'Failed to create checkout session';
    if (error.message?.includes('price')) {
      errorMessage = 'Invalid pricing configuration. Please contact support.';
    } else if (error.message?.includes('customer')) {
      errorMessage = 'Customer setup failed. Please try again.';
    } else if (error.message?.includes('currency')) {
      errorMessage = 'Currency not supported. Please contact support.';
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
