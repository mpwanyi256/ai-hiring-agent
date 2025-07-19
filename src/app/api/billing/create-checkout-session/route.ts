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
    const body = await request.json();

    console.log('Checkout session request body:', body);

    const { planId, successUrl, cancelUrl, userId, userEmail } = body;

    if (!planId || !successUrl || !cancelUrl || !userId || !userEmail) {
      console.error('Missing required fields:', {
        planId,
        successUrl,
        cancelUrl,
        userId,
        userEmail,
      });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    console.log('Looking up subscription plan with ID:', planId);

    // Get subscription plan from database
    const { data: plan, error: planError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) {
      console.error('Database plan lookup failed:', planError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subscription plan from database' },
        { status: 500 },
      );
    }

    if (!plan) {
      console.error('No plan found with ID:', planId);
      return NextResponse.json(
        { success: false, error: 'Invalid subscription plan' },
        { status: 400 },
      );
    }

    console.log('Found plan:', plan);

    // Check if we have a valid Stripe price ID
    if (!plan.stripe_price_id) {
      console.error('No Stripe price ID configured for plan:', plan.name);
      return NextResponse.json(
        { success: false, error: `No Stripe price configured for ${plan.name} plan` },
        { status: 400 },
      );
    }

    console.log('Using Stripe price ID from database:', plan.stripe_price_id);

    // Get or create Stripe customer - IMPROVED LOGIC
    let stripeCustomerId: string;

    try {
      // First, check if user already has a Stripe customer ID in user_subscriptions
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .not('stripe_customer_id', 'is', null)
        .single();

      if (existingSubscription?.stripe_customer_id) {
        // Verify the customer still exists in Stripe
        try {
          const customer = await stripe.customers.retrieve(existingSubscription.stripe_customer_id);
          if (customer && !customer.deleted) {
            stripeCustomerId = existingSubscription.stripe_customer_id;
            console.log('Using existing customer from database:', stripeCustomerId);
          } else {
            console.log('Customer in database was deleted in Stripe, will create new one');
            throw new Error('Customer deleted');
          }
        } catch (error) {
          console.log('Failed to retrieve customer from Stripe, will create new one');
          throw error;
        }
      } else {
        // No customer in database, check if one exists in Stripe by email
        console.log(
          'No customer in database, checking Stripe for existing customer with email:',
          userEmail,
        );

        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });

        if (customers.data.length > 0) {
          const existingCustomer = customers.data[0];
          stripeCustomerId = existingCustomer.id;
          console.log('Found existing customer in Stripe:', stripeCustomerId);

          // Update our database with this customer ID
          await supabase.from('user_subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: stripeCustomerId,
            },
            {
              onConflict: 'user_id',
            },
          );
        } else {
          // Create new Stripe customer
          const customer = await stripe.customers.create({
            email: userEmail,
            metadata: {
              userId,
            },
          });
          stripeCustomerId = customer.id;
          console.log('Created new customer:', stripeCustomerId);

          // Save customer ID to database
          await supabase.from('user_subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: stripeCustomerId,
            },
            {
              onConflict: 'user_id',
            },
          );
        }
      }
    } catch (error) {
      console.error('Error with customer lookup/creation:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create or retrieve customer' },
        { status: 500 },
      );
    }

    console.log(
      'Creating checkout session with plan:',
      plan.name,
      'price ID:',
      plan.stripe_price_id,
    );

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: plan.trial_days || 30, // 30 days free trial
        metadata: {
          userId,
          planId: plan.id,
        },
      },
      metadata: {
        userId,
        planId: plan.id,
      },
    });

    console.log('Created checkout session:', session.id);

    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
        sessionId: session.id,
      },
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
