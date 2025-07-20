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
    const {
      planId,
      billingPeriod = 'monthly',
      userId,
      userEmail,
      priceId, // This will come from the database helper function
      price, // This will come from the database
      planName, // This will come from the database
    } = body;

    console.log('Creating checkout session:', {
      planId,
      billingPeriod,
      userId,
      userEmail,
      priceId,
      price,
      planName,
    });

    if (!userId || !userEmail || !priceId || !planName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

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
      console.log('Using existing Stripe customer:', stripeCustomerId);
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      });
      stripeCustomerId = customer.id;
      console.log('Created new Stripe customer:', stripeCustomerId);
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
        metadata: {
          userId: userId,
          planId: planName, // Use plan name from database
          billingPeriod: billingPeriod,
        },
      },
    });

    console.log('Checkout session created:', session.id);

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
