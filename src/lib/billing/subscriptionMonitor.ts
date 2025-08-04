import { createClient } from '@/lib/supabase/client';
import { sendBillingEmail } from '@/lib/email/billingEmailService';
import Stripe from 'stripe';
import { integrations } from '@/lib/constants';

const stripe = new Stripe(integrations.stripe.secretKey!, {
  apiVersion: '2025-06-30.basil',
});

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

export interface SubscriptionMonitorResult {
  processed: number;
  errors: string[];
  notifications: number;
}

// Monitor subscriptions for various events
export class SubscriptionMonitor {
  private supabase = createClient();

  // Check for trials ending soon (3 days before expiry)
  async checkTrialsEndingSoon(): Promise<SubscriptionMonitorResult> {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const result: SubscriptionMonitorResult = {
      processed: 0,
      errors: [],
      notifications: 0,
    };

    try {
      const { data: subscriptions, error } = await this.supabase
        .from('user_subscriptions')
        .select(
          `
          id,
          user_id,
          stripe_subscription_id,
          trial_end,
          status,
          profiles(email, first_name, last_name, companies(name))
        `,
        )
        .eq('status', 'trialing')
        .not('trial_end', 'is', null)
        .lte('trial_end', threeDaysFromNow.toISOString())
        .gte('trial_end', new Date().toISOString());

      if (error) {
        result.errors.push(`Failed to fetch trials: ${error.message}`);
        return result;
      }

      if (!subscriptions?.length) {
        return result;
      }

      for (const subscription of subscriptions) {
        try {
          const profile = subscription.profiles as any;
          if (!profile?.email) {
            result.errors.push(`No email found for user ${subscription.user_id}`);
            continue;
          }

          await sendBillingEmail({
            type: 'trial_ending',
            to: profile.email,
            data: {
              customerName: `${profile.first_name} ${profile.last_name}`,
              companyName: profile.companies?.name || 'Your Company',
              trialEndDate: subscription.trial_end!,
              subscriptionId: subscription.stripe_subscription_id,
            },
          });

          result.notifications++;
        } catch (error: any) {
          result.errors.push(`Failed to send trial ending email: ${error.message}`);
        }

        result.processed++;
      }
    } catch (error: any) {
      result.errors.push(`Monitor error: ${error.message}`);
    }

    return result;
  }

  // Check for failed payments that need retry reminders
  async checkFailedPayments(): Promise<SubscriptionMonitorResult> {
    const result: SubscriptionMonitorResult = {
      processed: 0,
      errors: [],
      notifications: 0,
    };

    try {
      const { data: subscriptions, error } = await this.supabase
        .from('user_subscriptions')
        .select(
          `
          id,
          user_id,
          stripe_subscription_id,
          stripe_customer_id,
          status,
          updated_at,
          profiles(email, first_name, last_name, companies(name))
        `,
        )
        .in('status', ['past_due', 'unpaid']);

      if (error) {
        result.errors.push(`Failed to fetch failed payments: ${error.message}`);
        return result;
      }

      if (!subscriptions?.length) {
        return result;
      }

      for (const subscription of subscriptions) {
        try {
          // Get latest invoices from Stripe for this customer
          const invoices = await stripe.invoices.list({
            customer: subscription.stripe_customer_id,
            subscription: subscription.stripe_subscription_id,
            status: 'open',
            limit: 1,
          });

          if (invoices.data.length === 0) {
            continue;
          }

          const invoice = invoices.data[0];
          const profile = subscription.profiles as any;

          if (!profile?.email) {
            result.errors.push(`No email found for user ${subscription.user_id}`);
            continue;
          }

          // Check if we've already sent a reminder recently (within 24 hours)
          const lastUpdate = new Date(subscription.updated_at);
          const twentyFourHoursAgo = new Date();
          twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

          if (lastUpdate > twentyFourHoursAgo) {
            continue; // Skip if reminder was sent recently
          }

          await sendBillingEmail({
            type: 'payment_failed',
            to: profile.email,
            data: {
              customerName: `${profile.first_name} ${profile.last_name}`,
              companyName: profile.companies?.name || 'Your Company',
              amount: (invoice.amount_due / 100).toFixed(2),
              currency: invoice.currency.toUpperCase(),
              invoiceId: invoice.id,
              subscriptionId: subscription.stripe_subscription_id,
              dueDate: new Date(invoice.due_date! * 1000).toISOString(),
              paymentUrl: invoice.hosted_invoice_url || '',
            },
          });

          // Update the subscription timestamp to track reminder sent
          await this.supabase
            .from('user_subscriptions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', subscription.id);

          result.notifications++;
        } catch (error: any) {
          result.errors.push(`Failed to process failed payment: ${error.message}`);
        }

        result.processed++;
      }
    } catch (error: any) {
      result.errors.push(`Monitor error: ${error.message}`);
    }

    return result;
  }

  // Check for subscriptions that will expire soon
  async checkSubscriptionsExpiring(): Promise<SubscriptionMonitorResult> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const result: SubscriptionMonitorResult = {
      processed: 0,
      errors: [],
      notifications: 0,
    };

    try {
      const { data: subscriptions, error } = await this.supabase
        .from('user_subscriptions')
        .select(
          `
          id,
          user_id,
          stripe_subscription_id,
          current_period_end,
          cancel_at_period_end,
          status,
          profiles(email, first_name, last_name, companies(name))
        `,
        )
        .eq('status', 'active')
        .eq('cancel_at_period_end', true)
        .not('current_period_end', 'is', null)
        .lte('current_period_end', sevenDaysFromNow.toISOString())
        .gte('current_period_end', new Date().toISOString());

      if (error) {
        result.errors.push(`Failed to fetch expiring subscriptions: ${error.message}`);
        return result;
      }

      if (!subscriptions?.length) {
        return result;
      }

      for (const subscription of subscriptions) {
        try {
          const profile = subscription.profiles as any;
          if (!profile?.email) {
            result.errors.push(`No email found for user ${subscription.user_id}`);
            continue;
          }

          await sendBillingEmail({
            type: 'subscription_cancelled',
            to: profile.email,
            data: {
              customerName: `${profile.first_name} ${profile.last_name}`,
              companyName: profile.companies?.name || 'Your Company',
              cancellationDate: subscription.current_period_end!,
              subscriptionId: subscription.stripe_subscription_id,
            },
          });

          result.notifications++;
        } catch (error: any) {
          result.errors.push(`Failed to send expiration notice: ${error.message}`);
        }

        result.processed++;
      }
    } catch (error: any) {
      result.errors.push(`Monitor error: ${error.message}`);
    }

    return result;
  }

  // Sync subscription statuses with Stripe
  async syncSubscriptionStatuses(): Promise<SubscriptionMonitorResult> {
    const result: SubscriptionMonitorResult = {
      processed: 0,
      errors: [],
      notifications: 0,
    };

    try {
      const { data: subscriptions, error } = await this.supabase
        .from('user_subscriptions')
        .select('id, stripe_subscription_id, status')
        .not('stripe_subscription_id', 'is', null);

      if (error) {
        result.errors.push(`Failed to fetch subscriptions: ${error.message}`);
        return result;
      }

      if (!subscriptions?.length) {
        return result;
      }

      for (const subscription of subscriptions) {
        try {
          // Get current status from Stripe
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripe_subscription_id,
          );

          // Update if status has changed
          if (stripeSubscription.status !== subscription.status) {
            // Update subscription status in database
            const { error: updateError } = await this.supabase
              .from('user_subscriptions')
              .update({
                status: stripeSubscription.status,
                current_period_start: (() => {
                  const periods = getSubscriptionPeriods(stripeSubscription);
                  return periods.current_period_start
                    ? new Date(periods.current_period_start * 1000).toISOString()
                    : null;
                })(),
                current_period_end: (() => {
                  const periods = getSubscriptionPeriods(stripeSubscription);
                  return periods.current_period_end
                    ? new Date(periods.current_period_end * 1000).toISOString()
                    : null;
                })(),
                cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              })
              .eq('id', subscription.id);

            if (updateError) {
              result.errors.push(
                `Failed to update subscription ${subscription.stripe_subscription_id}: ${updateError.message}`,
              );
            } else {
              result.notifications++;
            }
          }
        } catch (error: any) {
          result.errors.push(
            `Failed to sync subscription ${subscription.stripe_subscription_id}: ${error.message}`,
          );
        }

        result.processed++;
      }
    } catch (error: any) {
      result.errors.push(`Sync error: ${error.message}`);
    }

    return result;
  }

  // Run all monitoring tasks
  async runAllChecks(): Promise<{
    trialsEnding: SubscriptionMonitorResult;
    failedPayments: SubscriptionMonitorResult;
    expiring: SubscriptionMonitorResult;
    sync: SubscriptionMonitorResult;
  }> {
    console.log('Starting subscription monitoring checks...');

    const [trialsEnding, failedPayments, expiring, sync] = await Promise.all([
      this.checkTrialsEndingSoon(),
      this.checkFailedPayments(),
      this.checkSubscriptionsExpiring(),
      this.syncSubscriptionStatuses(),
    ]);

    console.log('Subscription monitoring completed:', {
      trialsEnding: `${trialsEnding.notifications} notifications, ${trialsEnding.errors.length} errors`,
      failedPayments: `${failedPayments.notifications} notifications, ${failedPayments.errors.length} errors`,
      expiring: `${expiring.notifications} notifications, ${expiring.errors.length} errors`,
      sync: `${sync.notifications} updates, ${sync.errors.length} errors`,
    });

    return { trialsEnding, failedPayments, expiring, sync };
  }
}

// Utility function to run monitoring checks
export async function runSubscriptionMonitoring(): Promise<void> {
  const monitor = new SubscriptionMonitor();
  await monitor.runAllChecks();
}

// Export for use in cron jobs or manual triggers
export default SubscriptionMonitor;
