import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { integrations, monitoring } from '@/lib/constants';
import { sendBillingEmail } from '@/lib/email/billingEmailService';

const stripe = new Stripe(integrations.stripe.secretKey!, {
  apiVersion: '2025-06-30.basil',
});

// Validate monitoring API key from query parameter
function validateMonitoringKey(request: NextRequest): boolean {
  const url = new URL(request.url);
  const keyFromQuery = url.searchParams.get('key');

  console.log('🔍 Monitoring Key Debug:');
  console.log('  - URL:', url.toString());
  console.log(
    '  - Key from query:',
    keyFromQuery ? 'Present (length: ' + keyFromQuery.length + ')' : 'Not found',
  );
  console.log(
    '  - Expected monitoring key:',
    monitoring.apiKey ? 'Present (length: ' + monitoring.apiKey.length + ')' : 'Not found',
  );

  if (!keyFromQuery) {
    console.error('❌ Missing monitoring API key in query parameter');
    return false;
  }

  if (!monitoring.apiKey) {
    console.error('❌ Missing monitoring API key in environment');
    return false;
  }

  const isValid = keyFromQuery === monitoring.apiKey;
  console.log('  - Monitoring key validation:', isValid ? '✅ Valid' : '❌ Invalid');
  return isValid;
}

// Get Stripe webhook secret from environment
function getStripeWebhookSecret(): string | null {
  const webhookSecret = integrations.stripe.webhookSecret;
  console.log(
    '🔍 Stripe Webhook Secret:',
    webhookSecret ? 'Present (length: ' + webhookSecret.length + ')' : 'Not found',
  );

  if (!webhookSecret) {
    console.error('❌ Missing Stripe webhook secret in environment');
    return null;
  }

  return webhookSecret;
}

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

// Helper function to get user profile information
async function getUserProfile(userId: string, supabase: any) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, company_id, companies(name)')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Helper function to log webhook events for debugging
async function logWebhookEvent(
  supabase: any,
  eventType: string,
  eventData: any,
  status: 'success' | 'error',
  errorMessage?: string,
) {
  try {
    await supabase.from('webhook_logs').insert({
      event_type: eventType,
      event_data: eventData,
      status,
      error_message: errorMessage,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }
}

// Helper function to create in-app notification for billing events
async function createBillingNotification(
  supabase: any,
  userId: string,
  type: 'success' | 'warning' | 'error' | 'info',
  title: string,
  message: string,
  metadata: any = {},
  actionUrl?: string,
  actionText?: string,
) {
  try {
    // Get user's company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Failed to get user profile for notification:', profileError);
      return;
    }

    // Create in-app notification
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: userId,
      company_id: profile.company_id,
      type: type,
      category: 'billing',
      title: title,
      message: message,
      metadata: metadata,
      action_url: actionUrl,
      action_text: actionText,
      created_at: new Date().toISOString(),
    });

    if (notificationError) {
      console.error('Failed to create billing notification:', notificationError);
    } else {
      console.log('Created billing notification:', title);
    }
  } catch (error) {
    console.error('Error creating billing notification:', error);
  }
}

// Helper function to get subscription item periods
function getSubscriptionPeriods(subscription: Stripe.Subscription) {
  // Get the first subscription item to extract period information
  const firstItem = subscription.items.data[0];
  if (firstItem) {
    return {
      current_period_start: firstItem.current_period_start,
      current_period_end: firstItem.current_period_end,
    };
  }

  // Fallback to subscription level dates if available
  return {
    current_period_start: subscription.billing_cycle_anchor,
    current_period_end: subscription.billing_cycle_anchor + 30 * 24 * 60 * 60, // 30 days default
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    console.log('🔍 Webhook Request Debug:');
    console.log('  - Body length:', body.length);
    console.log(
      '  - Signature present:',
      signature ? 'Yes (length: ' + signature.length + ')' : 'No',
    );
    console.log('  - Content-Type:', headersList.get('content-type'));
    console.log('  - User-Agent:', headersList.get('user-agent'));

    if (!signature) {
      console.error('❌ Missing stripe signature');
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    // First, validate the monitoring API key
    if (!validateMonitoringKey(request)) {
      console.error('❌ Invalid monitoring API key');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Then, get the Stripe webhook secret for signature verification
    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret) {
      console.error('❌ Missing Stripe webhook secret');
      return NextResponse.json({ error: 'Missing webhook configuration' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      console.log('🔍 Attempting to construct event with Stripe signature verification...');
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Event constructed successfully:', event.type);
    } catch (err: any) {
      console.error('❌ Stripe webhook signature verification failed:');
      console.error('  - Error message:', err.message);
      console.error('  - Error type:', err.type);
      console.error('  - Signature used:', signature?.substring(0, 20) + '...');
      console.error('  - Stripe webhook secret prefix:', webhookSecret?.substring(0, 10) + '...');
      console.error('  - Note: This is different from the monitoring API key in the URL');
      return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
    }

    const supabase = await createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const periods = getSubscriptionPeriods(subscription);

          // Get the plan name from metadata
          const planName = session.metadata?.planId;
          const userId = session.metadata?.userId;

          if (!planName) {
            await logWebhookEvent(
              supabase,
              event.type,
              session,
              'error',
              'No plan name in metadata',
            );
            return NextResponse.json({ error: 'No plan name in metadata' }, { status: 400 });
          }

          if (!userId) {
            await logWebhookEvent(supabase, event.type, session, 'error', 'No user ID in metadata');
            return NextResponse.json({ error: 'No user ID in metadata' }, { status: 400 });
          }

          // Get subscription ID from database using plan name
          const subscriptionId = await getSubscriptionIdFromPlanName(planName, supabase);

          if (!subscriptionId) {
            await logWebhookEvent(
              supabase,
              event.type,
              session,
              'error',
              `No subscription found for plan: ${planName}`,
            );
            return NextResponse.json(
              { error: `No subscription found for plan: ${planName}` },
              { status: 400 },
            );
          }

          // Check if user already has a subscription
          const { data: existingSubscription, error: checkError } = await supabase
            .from('user_subscriptions')
            .select('id, status, stripe_subscription_id, subscription_id, subscriptions(name)')
            .eq('profile_id', userId)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            await logWebhookEvent(supabase, event.type, session, 'error', 'Database check failed');
            return NextResponse.json({ error: 'Database check failed' }, { status: 500 });
          }

          // If user has an existing active subscription, cancel it to ensure single subscription
          let isUpgrade = false;
          let oldPlanName = null;
          if (existingSubscription && existingSubscription.stripe_subscription_id) {
            try {
              // Cancel the old subscription in Stripe
              await stripe.subscriptions.cancel(existingSubscription.stripe_subscription_id);

              // Get old plan name for email notification
              oldPlanName = existingSubscription.subscriptions?.[0]?.name;
              isUpgrade = true; // Any plan change from existing subscription
            } catch (stripeError) {
              console.error('Failed to cancel existing subscription:', stripeError);
              // Continue with new subscription creation even if old cancellation fails
            }
          }

          const subscriptionData = {
            profile_id: userId,
            subscription_id: subscriptionId,
            status: subscription.status,
            current_period_start: periods.current_period_start
              ? new Date(periods.current_period_start * 1000).toISOString()
              : new Date().toISOString(),
            current_period_end: periods.current_period_end
              ? new Date(periods.current_period_end * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            trial_start: subscription.trial_start
              ? new Date(subscription.trial_start * 1000).toISOString()
              : null,
            trial_end: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
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
            await logWebhookEvent(supabase, event.type, session, 'error', 'Database update failed');
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
          }

          // Send appropriate email notification
          try {
            const customerEmail = session.customer_details?.email || session.customer_email;
            if (customerEmail) {
              const emailType = isUpgrade ? 'plan_changed' : 'subscription_created';
              await sendBillingEmail({
                type: emailType,
                to: customerEmail,
                data: {
                  customerName: session.customer_details?.name || customerEmail,
                  planName: planName,
                  oldPlanName: oldPlanName,
                  isUpgrade: isUpgrade,
                  amount: (session.amount_total || 0) / 100,
                  nextBillingDate: new Date(periods.current_period_end * 1000).toLocaleDateString(),
                },
              });
            }
          } catch (emailError) {
            console.error('Failed to send subscription email:', emailError);
            // Don't fail the webhook if email fails
          }

          // Create in-app notification
          await createBillingNotification(
            supabase,
            userId,
            'success',
            isUpgrade
              ? `Plan changed from ${oldPlanName} to ${planName}`
              : `Welcome to ${planName}!`,
            isUpgrade
              ? `Your subscription has been updated to the ${planName} plan.`
              : `Your ${planName} subscription is now active. Welcome aboard!`,
            {
              subscription_id: subscription.id,
              plan_name: planName,
              old_plan_name: oldPlanName,
              event_type: isUpgrade ? 'plan_changed' : 'subscription_created',
            },
            '/billing',
            'View Billing',
          );

          await logWebhookEvent(supabase, event.type, session, 'success');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const periods = getSubscriptionPeriods(subscription);

        // Find the user subscription by stripe_subscription_id
        const { data: userSubscription, error: findError } = await supabase
          .from('user_subscriptions')
          .select('id, profile_id, status')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (findError) {
          console.error('Error finding subscription to update:', findError);
          await logWebhookEvent(
            supabase,
            event.type,
            subscription,
            'error',
            'Subscription not found',
          );
          break;
        }

        if (!userSubscription) {
          console.error('No user subscription found for Stripe subscription:', subscription.id);
          await logWebhookEvent(
            supabase,
            event.type,
            subscription,
            'error',
            'User subscription not found',
          );
          break;
        }

        const oldStatus = userSubscription.status;

        // Update user subscription
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: periods.current_period_start
              ? new Date(periods.current_period_start * 1000).toISOString()
              : new Date().toISOString(),
            current_period_end: periods.current_period_end
              ? new Date(periods.current_period_end * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            trial_start: subscription.trial_start
              ? new Date(subscription.trial_start * 1000).toISOString()
              : null,
            trial_end: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userSubscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
          await logWebhookEvent(
            supabase,
            event.type,
            subscription,
            'error',
            'Database update failed',
          );
        } else {
          // Send email notifications for status changes OR cancellation flags
          const userProfile = await getUserProfile(userSubscription.profile_id, supabase);

          // Check if subscription was cancelled (either status change or cancel_at_period_end flag)
          const wasCancelled =
            subscription.status === 'canceled' ||
            (subscription.cancel_at_period_end &&
              event.data.previous_attributes?.cancel_at_period_end === false);

          // Check for status change or important subscription changes
          const hasImportantChange = oldStatus !== subscription.status || wasCancelled;

          if (userProfile && hasImportantChange) {
            if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
              await sendBillingEmail({
                type: 'subscription_cancelled',
                to: userProfile.email,
                data: {
                  customerName: `${userProfile.first_name} ${userProfile.last_name}`,
                  companyName: userProfile.companies?.name || 'Your Company',
                  cancellationDate: subscription.cancel_at_period_end
                    ? new Date(periods.current_period_end * 1000).toISOString()
                    : new Date().toISOString(),
                  subscriptionId: subscription.id,
                },
              });

              // Create in-app notification for cancellation
              await createBillingNotification(
                supabase,
                userSubscription.profile_id,
                'info',
                'Subscription Cancelled',
                'Your subscription has been cancelled. You will continue to have access until your current billing period ends.',
                {
                  subscription_id: subscription.id,
                  event_type: 'subscription_cancelled',
                  cancellation_date: subscription.cancel_at_period_end
                    ? new Date(periods.current_period_end * 1000).toISOString()
                    : new Date().toISOString(),
                },
                '/billing',
                'Reactivate',
              );
            } else if (subscription.status === 'active' && oldStatus === 'past_due') {
              // Payment succeeded after being past due
              await createBillingNotification(
                supabase,
                userSubscription.profile_id,
                'success',
                'Payment Successful',
                'Your payment has been processed successfully. Your subscription is now active.',
                {
                  subscription_id: subscription.id,
                  event_type: 'payment_recovered',
                },
                '/billing',
                'View Receipt',
              );
            }
          }
          await logWebhookEvent(supabase, event.type, subscription, 'success');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find the user subscription by stripe_subscription_id
        const { data: userSubscription, error: findError } = await supabase
          .from('user_subscriptions')
          .select('id, profile_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (findError) {
          console.error('Error finding subscription to cancel:', findError);
          await logWebhookEvent(
            supabase,
            event.type,
            subscription,
            'error',
            'Subscription not found',
          );
          break;
        }

        if (!userSubscription) {
          console.error('No user subscription found for Stripe subscription:', subscription.id);
          await logWebhookEvent(
            supabase,
            event.type,
            subscription,
            'error',
            'User subscription not found',
          );
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
          await logWebhookEvent(
            supabase,
            event.type,
            subscription,
            'error',
            'Database update failed',
          );
        } else {
          // Send cancellation confirmation email
          const userProfile = await getUserProfile(userSubscription.profile_id, supabase);
          if (userProfile) {
            await sendBillingEmail({
              type: 'subscription_ended',
              to: userProfile.email,
              data: {
                customerName: `${userProfile.first_name} ${userProfile.last_name}`,
                companyName: userProfile.companies?.name || 'Your Company',
                subscriptionId: subscription.id,
              },
            });

            // Create in-app notification for subscription ended
            await createBillingNotification(
              supabase,
              userSubscription.profile_id,
              'info',
              'Subscription Ended',
              'Your subscription has ended. You can reactivate at any time to continue using our services.',
              {
                subscription_id: subscription.id,
                event_type: 'subscription_ended',
              },
              '/pricing',
              'View Plans',
            );
          }
          await logWebhookEvent(supabase, event.type, subscription, 'success');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        // Access subscription from lines data since it's not directly on invoice
        const subscriptionId = invoice.lines.data.find((line) => line.subscription)
          ?.subscription as string | undefined;

        if (subscriptionId) {
          // Find the user subscription by stripe_subscription_id
          const { data: userSubscription, error: findError } = await supabase
            .from('user_subscriptions')
            .select('id, profile_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (findError) {
            console.error('Error finding subscription for payment failure:', findError);
            await logWebhookEvent(supabase, event.type, invoice, 'error', 'Subscription not found');
            break;
          }

          if (!userSubscription) {
            console.error('No user subscription found for Stripe subscription:', subscriptionId);
            await logWebhookEvent(
              supabase,
              event.type,
              invoice,
              'error',
              'User subscription not found',
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
            await logWebhookEvent(supabase, event.type, invoice, 'error', 'Database update failed');
          } else {
            // Send payment failure notification
            const userProfile = await getUserProfile(userSubscription.profile_id, supabase);
            if (userProfile) {
              await sendBillingEmail({
                type: 'payment_failed',
                to: userProfile.email,
                data: {
                  customerName: `${userProfile.first_name} ${userProfile.last_name}`,
                  companyName: userProfile.companies?.name || 'Your Company',
                  amount: (invoice.amount_due / 100).toFixed(2),
                  currency: invoice.currency.toUpperCase(),
                  invoiceId: invoice.id,
                  subscriptionId: subscriptionId,
                  dueDate: invoice.due_date
                    ? new Date(invoice.due_date * 1000).toISOString()
                    : new Date().toISOString(),
                  paymentUrl: invoice.hosted_invoice_url || '',
                },
              });

              // Create in-app notification for payment failure
              await createBillingNotification(
                supabase,
                userSubscription.profile_id,
                'warning',
                'Payment Failed',
                `We were unable to process your payment of ${invoice.currency.toUpperCase()} ${(invoice.amount_due / 100).toFixed(2)}. Please update your payment method.`,
                {
                  invoice_id: invoice.id,
                  subscription_id: subscriptionId,
                  amount: invoice.amount_due / 100,
                  currency: invoice.currency,
                  event_type: 'payment_failed',
                },
                '/billing',
                'Update Payment',
              );
            }
            await logWebhookEvent(supabase, event.type, invoice, 'success');
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        // Access subscription from lines data since it's not directly on invoice
        const subscriptionId = invoice.lines.data.find((line) => line.subscription)
          ?.subscription as string | undefined;

        if (subscriptionId) {
          // Find the user subscription by stripe_subscription_id
          const { data: userSubscription, error: findError } = await supabase
            .from('user_subscriptions')
            .select('id, profile_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (findError) {
            console.error('Error finding subscription for payment success:', findError);
            await logWebhookEvent(supabase, event.type, invoice, 'error', 'Subscription not found');
            break;
          }

          if (!userSubscription) {
            console.error('No user subscription found for Stripe subscription:', subscriptionId);
            await logWebhookEvent(
              supabase,
              event.type,
              invoice,
              'error',
              'User subscription not found',
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
            await logWebhookEvent(supabase, event.type, invoice, 'error', 'Database update failed');
          } else {
            // Send payment receipt email
            const userProfile = await getUserProfile(userSubscription.profile_id, supabase);
            if (userProfile) {
              await sendBillingEmail({
                type: 'payment_receipt',
                to: userProfile.email,
                data: {
                  customerName: `${userProfile.first_name} ${userProfile.last_name}`,
                  companyName: userProfile.companies?.name || 'Your Company',
                  amount: (invoice.amount_paid / 100).toFixed(2),
                  currency: invoice.currency.toUpperCase(),
                  invoiceId: invoice.id,
                  subscriptionId: subscriptionId,
                  paymentDate: invoice.status_transitions.paid_at
                    ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
                    : new Date().toISOString(),
                  receiptUrl: invoice.invoice_pdf || '',
                  nextBillingDate: invoice.next_payment_attempt
                    ? new Date(invoice.next_payment_attempt * 1000).toISOString()
                    : null,
                },
              });

              // Create in-app notification for successful payment
              await createBillingNotification(
                supabase,
                userSubscription.profile_id,
                'success',
                'Payment Received',
                `Thank you! Your payment of ${invoice.currency.toUpperCase()} ${(invoice.amount_paid / 100).toFixed(2)} has been processed successfully.`,
                {
                  invoice_id: invoice.id,
                  subscription_id: subscriptionId,
                  amount: invoice.amount_paid / 100,
                  currency: invoice.currency,
                  payment_date: invoice.status_transitions.paid_at
                    ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
                    : new Date().toISOString(),
                  event_type: 'payment_succeeded',
                },
                '/billing',
                'View Receipt',
              );
            }
            await logWebhookEvent(supabase, event.type, invoice, 'success');
          }
        }
        break;
      }

      case 'invoice.upcoming': {
        const invoice = event.data.object as Stripe.Invoice;

        // Access subscription from lines data since it's not directly on invoice
        const subscriptionId = invoice.lines.data.find((line) => line.subscription)
          ?.subscription as string | undefined;

        if (subscriptionId) {
          // Find the user subscription by stripe_subscription_id
          const { data: userSubscription, error: findError } = await supabase
            .from('user_subscriptions')
            .select('id, profile_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (findError || !userSubscription) {
            console.error('Error finding subscription for upcoming invoice:', findError);
            await logWebhookEvent(supabase, event.type, invoice, 'error', 'Subscription not found');
            break;
          }

          // Send upcoming payment reminder
          const userProfile = await getUserProfile(userSubscription.profile_id, supabase);
          if (userProfile) {
            await sendBillingEmail({
              type: 'payment_reminder',
              to: userProfile.email,
              data: {
                customerName: `${userProfile.first_name} ${userProfile.last_name}`,
                companyName: userProfile.companies?.name || 'Your Company',
                amount: (invoice.amount_due / 100).toFixed(2),
                currency: invoice.currency.toUpperCase(),
                dueDate: invoice.due_date
                  ? new Date(invoice.due_date * 1000).toISOString()
                  : new Date().toISOString(),
                subscriptionId: subscriptionId,
              },
            });
          }
          await logWebhookEvent(supabase, event.type, invoice, 'success');
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find the user subscription by stripe_subscription_id
        const { data: userSubscription, error: findError } = await supabase
          .from('user_subscriptions')
          .select('id, profile_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (findError || !userSubscription) {
          console.error('Error finding subscription for trial ending:', findError);
          await logWebhookEvent(
            supabase,
            event.type,
            subscription,
            'error',
            'Subscription not found',
          );
          break;
        }

        // Send trial ending notification
        const userProfile = await getUserProfile(userSubscription.profile_id, supabase);
        if (userProfile) {
          await sendBillingEmail({
            type: 'trial_ending',
            to: userProfile.email,
            data: {
              customerName: `${userProfile.first_name} ${userProfile.last_name}`,
              companyName: userProfile.companies?.name || 'Your Company',
              trialEndDate: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : new Date().toISOString(),
              subscriptionId: subscription.id,
            },
          });
        }
        await logWebhookEvent(supabase, event.type, subscription, 'success');
        break;
      }

      default:
        await logWebhookEvent(
          supabase,
          event.type,
          event.data.object,
          'success',
          'Unhandled event type',
        );
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
