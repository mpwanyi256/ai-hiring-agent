import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { integrations, isDev } from '@/lib/constants';

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

    // Get plan details to fetch priceId and planName
    const { data: planDetails, error: planError } = await supabase
      .from('subscriptions')
      .select(
        'name, trial_days, stripe_price_id_dev, stripe_price_id_prod, stripe_price_id_dev_yearly, stripe_price_id_prod_yearly',
      )
      .eq('name', planId)
      .eq('is_active', true)
      .single();

    if (planError || !planDetails) {
      console.error('Error fetching plan details:', planError);
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
    }

    // Determine the correct price ID based on billing period and environment using isDev constant
    let priceId: string;

    if (billingPeriod === 'yearly') {
      priceId = isDev
        ? planDetails.stripe_price_id_dev_yearly
        : planDetails.stripe_price_id_prod_yearly;
    } else {
      priceId = isDev ? planDetails.stripe_price_id_dev : planDetails.stripe_price_id_prod;
    }

    if (!priceId) {
      console.error(
        'No price ID found for plan:',
        planId,
        'billing period:',
        billingPeriod,
        'environment:',
        isDev ? 'development' : 'production',
      );
      return NextResponse.json(
        { error: 'Price ID not configured for this plan and billing period' },
        { status: 400 },
      );
    }

    const userEmail = userProfile.email;
    const planName = planDetails.name;

    // Get or create Stripe customer
    let stripeCustomerId: string;

    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Use the price ID from database
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.nextUrl.origin}/dashboard?success=true`,
      cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
      metadata: {
        userId: userId,
        planId: planName, // Use plan name from database
        billingPeriod: billingPeriod,
      },
      subscription_data: {
        trial_period_days: planDetails.trial_days || undefined, // Apply trial period from database
        metadata: {
          userId: userId,
          planId: planName, // Use plan name from database
          billingPeriod: billingPeriod,
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
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
