import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { integrations } from '@/lib/constants';

const stripe = new Stripe(integrations.stripe.secretKey!, {
  apiVersion: '2025-06-30.basil',
});

const webhookSecret = integrations.stripe.webhookSecret!;

// Helper function to get subscription ID from plan name using the new database structure
async function getSubscriptionIdFromPlanName(
  planName: string,
  supabase: any,
): Promise<string | null> {
  try {
    console.log(`🔍 Looking up subscription ID for plan: ${planName}`);

    // Use the new database structure with proper plan names
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('id, name, description')
      .ilike('name', planName)
      .eq('is_active', true)
      .single();

    if (error) {
      console.log(`❌ No subscription found for plan name: ${planName}`, error);
      return null;
    }

    console.log(`✅ Found subscription: ${subscription.name} (${subscription.description})`);
    return subscription.id;
  } catch (error) {
    console.error('❌ Error finding subscription ID for plan:', planName, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    console.log('🔔 Webhook received:', {
      method: request.method,
      url: request.url,
      hasSignature: !!signature,
      bodyLength: body.length,
    });

    if (!signature) {
      console.error('❌ Missing stripe signature');
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified');
      console.log('📋 Event type:', event.type);
      console.log('📋 Event ID:', event.id);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = await createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('🛒 Processing checkout.session.completed');
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          console.log('📦 Retrieving subscription details...');
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          console.log('📦 Stripe Subscription received via webhook:', {
            id: subscription.id,
            status: subscription.status,
            customer: subscription.customer,
            metadata: session.metadata,
          });

          // Get the plan name from metadata
          const planName = session.metadata?.planId;
          console.log('📋 Plan name from metadata:', planName);

          if (!planName) {
            console.error('❌ No plan name found in metadata');
            return NextResponse.json({ error: 'No plan name in metadata' }, { status: 400 });
          }

          // Get subscription ID from database using plan name
          const subscriptionId = await getSubscriptionIdFromPlanName(planName, supabase);

          if (!subscriptionId) {
            console.error(`❌ No subscription found in database for plan: ${planName}`);
            return NextResponse.json(
              { error: `No subscription found for plan: ${planName}` },
              { status: 400 },
            );
          }

          console.log(`📋 Found subscription ID: ${subscriptionId} for plan: ${planName}`);

          // Update or create user subscription with enhanced data
          const { error } = await supabase.from('user_subscriptions').upsert({
            user_id: session.metadata?.userId,
            subscription_id: subscriptionId, // Use the database subscription ID
            status: subscription.status,
            current_period_start: new Date(
              (subscription as any).current_period_start * 1000,
            ).toISOString(),
            current_period_end: new Date(
              (subscription as any).current_period_end * 1000,
            ).toISOString(),
            trial_start: (subscription as any).trial_start
              ? new Date((subscription as any).trial_start * 1000).toISOString()
              : null,
            trial_end: (subscription as any).trial_end
              ? new Date((subscription as any).trial_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.error('❌ Error updating subscription:', error);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
          } else {
            console.log('✅ Subscription updated successfully');
          }
        } else {
          console.log('⚠️ Session is not a subscription or missing subscription ID');
        }
        break;
      }

      case 'customer.subscription.updated': {
        console.log('🔄 Processing customer.subscription.updated');
        const subscription = event.data.object as Stripe.Subscription;

        console.log('📦 Subscription updated:', {
          id: subscription.id,
          status: subscription.status,
          customer: subscription.customer,
        });

        // Update user subscription
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(
              (subscription as any).current_period_start * 1000,
            ).toISOString(),
            current_period_end: new Date(
              (subscription as any).current_period_end * 1000,
            ).toISOString(),
            trial_start: (subscription as any).trial_start
              ? new Date((subscription as any).trial_start * 1000).toISOString()
              : null,
            trial_end: (subscription as any).trial_end
              ? new Date((subscription as any).trial_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('❌ Error updating subscription:', error);
        } else {
          console.log('✅ Subscription updated successfully');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        console.log('🗑️ Processing customer.subscription.deleted');
        const subscription = event.data.object as Stripe.Subscription;

        console.log('📦 Subscription deleted:', {
          id: subscription.id,
          status: subscription.status,
        });

        // Mark subscription as canceled
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('❌ Error canceling subscription:', error);
        } else {
          console.log('✅ Subscription marked as canceled');
        }
        break;
      }

      case 'invoice.payment_failed': {
        console.log('💳 Processing invoice.payment_failed');
        const invoice = event.data.object as Stripe.Invoice;

        if ((invoice as any).subscription) {
          console.log('📦 Payment failed for subscription:', (invoice as any).subscription);

          // Update subscription status to past_due
          const { error } = await supabase
            .from('user_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', (invoice as any).subscription as string);

          if (error) {
            console.error('❌ Error updating subscription status:', error);
          } else {
            console.log('✅ Subscription marked as past_due');
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        console.log('✅ Processing invoice.payment_succeeded');
        const invoice = event.data.object as Stripe.Invoice;

        if ((invoice as any).subscription) {
          console.log('📦 Payment succeeded for subscription:', (invoice as any).subscription);

          // Update subscription status to active
          const { error } = await supabase
            .from('user_subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', (invoice as any).subscription as string);

          if (error) {
            console.error('❌ Error updating subscription status:', error);
          } else {
            console.log('✅ Subscription marked as active');
          }
        }
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
