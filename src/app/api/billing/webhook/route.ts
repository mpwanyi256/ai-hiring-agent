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
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('id, name, description')
      .ilike('name', planName)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('No subscription found for plan name:', planName, error);
      return null;
    }

    return subscription.id;
  } catch (error) {
    console.error('Error finding subscription ID for plan:', planName, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe signature');
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = await createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          // Get the plan name from metadata
          const planName = session.metadata?.planId;

          if (!planName) {
            console.error('No plan name found in metadata');
            return NextResponse.json({ error: 'No plan name in metadata' }, { status: 400 });
          }

          // Get subscription ID from database using plan name
          const subscriptionId = await getSubscriptionIdFromPlanName(planName, supabase);

          if (!subscriptionId) {
            console.error(`No subscription found in database for plan: ${planName}`);
            return NextResponse.json(
              { error: `No subscription found for plan: ${planName}` },
              { status: 400 },
            );
          }

          // Check if user already has a subscription
          const { data: existingSubscription, error: checkError } = await supabase
            .from('user_subscriptions')
            .select('id, status')
            .eq('user_id', session.metadata?.userId)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing subscription:', checkError);
            return NextResponse.json({ error: 'Database check failed' }, { status: 500 });
          }

          const subscriptionData = {
            user_id: session.metadata?.userId,
            subscription_id: subscriptionId,
            status: subscription.status,
            current_period_start: (subscription as any).current_period_start
              ? new Date((subscription as any).current_period_start * 1000).toISOString()
              : new Date().toISOString(),
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
          };

          let error;
          if (existingSubscription) {
            // Update existing subscription
            const { error: updateError } = await supabase
              .from('user_subscriptions')
              .update(subscriptionData)
              .eq('id', existingSubscription.id);

            error = updateError;
          } else {
            // Create new subscription
            const { error: insertError } = await supabase
              .from('user_subscriptions')
              .insert(subscriptionData);

            error = insertError;
          }

          if (error) {
            console.error('Error updating subscription:', error);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find the user subscription by stripe_subscription_id
        const { data: userSubscription, error: findError } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (findError) {
          console.error('Error finding subscription to update:', findError);
          break;
        }

        if (!userSubscription) {
          console.error('No user subscription found for Stripe subscription:', subscription.id);
          break;
        }

        // Update user subscription
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: (subscription as any).current_period_start
              ? new Date((subscription as any).current_period_start * 1000).toISOString()
              : new Date().toISOString(),
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            trial_start: (subscription as any).trial_start
              ? new Date((subscription as any).trial_start * 1000).toISOString()
              : null,
            trial_end: (subscription as any).trial_end
              ? new Date((subscription as any).trial_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userSubscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find the user subscription by stripe_subscription_id
        const { data: userSubscription, error: findError } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (findError) {
          console.error('Error finding subscription to cancel:', findError);
          break;
        }

        if (!userSubscription) {
          console.error('No user subscription found for Stripe subscription:', subscription.id);
          break;
        }

        // Mark subscription as canceled
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userSubscription.id);

        if (error) {
          console.error('Error canceling subscription:', error);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if ((invoice as any).subscription) {
          // Find the user subscription by stripe_subscription_id
          const { data: userSubscription, error: findError } = await supabase
            .from('user_subscriptions')
            .select('id')
            .eq('stripe_subscription_id', (invoice as any).subscription as string)
            .single();

          if (findError) {
            console.error('Error finding subscription for payment failure:', findError);
            break;
          }

          if (!userSubscription) {
            console.error(
              'No user subscription found for Stripe subscription:',
              (invoice as any).subscription,
            );
            break;
          }

          // Update subscription status to past_due
          const { error } = await supabase
            .from('user_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userSubscription.id);

          if (error) {
            console.error('Error updating subscription status:', error);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if ((invoice as any).subscription) {
          // Find the user subscription by stripe_subscription_id
          const { data: userSubscription, error: findError } = await supabase
            .from('user_subscriptions')
            .select('id')
            .eq('stripe_subscription_id', (invoice as any).subscription as string)
            .single();

          if (findError) {
            console.error('Error finding subscription for payment success:', findError);
            break;
          }

          if (!userSubscription) {
            console.error(
              'No user subscription found for Stripe subscription:',
              (invoice as any).subscription,
            );
            break;
          }

          // Update subscription status to active
          const { error } = await supabase
            .from('user_subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userSubscription.id);

          if (error) {
            console.error('Error updating subscription status:', error);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
