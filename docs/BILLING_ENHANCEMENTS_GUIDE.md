# Billing Enhancements Guide

This document outlines the comprehensive billing enhancements implemented to provide a robust, industry-standard subscription management system with Stripe integration.

## Overview

The billing system has been enhanced with the following key features:

1. **Comprehensive Webhook Handling** - Graceful processing of all Stripe webhook events
2. **Email Notifications** - Automated email notifications for billing events using Resend
3. **Subscription Monitoring** - Proactive monitoring and notifications for subscription lifecycle events
4. **Enhanced Redux State Management** - Improved state management with granular loading states
5. **Payment Retry System** - Graceful handling of failed payments with retry mechanisms
6. **Webhook Logging** - Comprehensive logging for debugging and monitoring

## Features Implemented

### 1. Enhanced Webhook Handler (`/api/billing/webhook`)

**File:** `src/app/api/billing/webhook/route.ts`

The webhook handler now processes the following Stripe events:

- `checkout.session.completed` - New subscription creation
- `customer.subscription.updated` - Subscription status changes
- `customer.subscription.deleted` - Subscription cancellations
- `invoice.payment_failed` - Failed payment handling
- `invoice.payment_succeeded` - Successful payment processing with receipts
- `invoice.upcoming` - Payment reminders
- `customer.subscription.trial_will_end` - Trial ending notifications

**Key Features:**

- User profile fetching for personalized emails
- Webhook event logging for debugging
- Graceful error handling with detailed logging
- Automatic email notifications for all billing events

### 2. Billing Email Service

**File:** `src/lib/email/billingEmailService.ts`

Comprehensive email templates for:

- **Subscription Created** - Welcome emails for new subscriptions
- **Payment Receipt** - Detailed receipts for successful payments
- **Payment Failed** - Professional failure notifications with action items
- **Payment Reminder** - Friendly upcoming payment reminders
- **Subscription Cancelled** - Cancellation confirmations with reactivation options
- **Subscription Ended** - End-of-service notifications with re-subscription options
- **Trial Ending** - Trial expiration warnings with upgrade prompts

**Features:**

- Professional HTML and text email templates
- Responsive design optimized for all email clients
- Dynamic content with customer and company information
- Action buttons for easy customer engagement
- Fallback text versions for accessibility

### 3. Subscription Monitoring System

**File:** `src/lib/billing/subscriptionMonitor.ts`

Automated monitoring for:

- **Trial Endings** - Notifications 3 days before trial expiry
- **Failed Payments** - Automated retry reminders (rate-limited to 24 hours)
- **Subscription Expiry** - Warnings 7 days before cancellation takes effect
- **Status Synchronization** - Real-time sync with Stripe subscription statuses

**API Endpoint:** `POST /api/billing/monitor`

- Manual trigger for monitoring checks
- Protected with API key authentication
- Comprehensive reporting of processed items and errors

### 4. Enhanced Redux State Management

**File:** `src/store/billing/billingSlice.ts`

**New State Properties:**

```typescript
interface ExtendedBillingState extends BillingState {
  loadingStates: {
    subscription: boolean;
    plans: boolean;
    checkout: boolean;
    portal: boolean;
    statusCheck: boolean;
    paymentRetry: boolean;
    notifications: boolean;
  };
  hasActiveSubscription: boolean;
  lastWebhookUpdate: string | null;
  notificationPreferences: BillingNotificationPreferences;
  retryCount: number;
  maxRetryAttempts: number;
}
```

**New Actions:**

- `updateSubscriptionStatus` - Update subscription status from webhooks
- `handleWebhookSubscriptionUpdate` - Process real-time webhook updates
- `setWebhookUpdate` - Track last webhook update timestamp
- `updateNotificationPreferences` - Manage email notification preferences
- `incrementRetryCount` / `resetRetryCount` - Payment retry management

### 5. Payment Retry System

**File:** `src/app/api/billing/retry-payment/route.ts`

**Features:**

- Secure payment retry with user verification
- Invoice ownership validation
- Detailed Stripe error handling with user-friendly messages
- Automatic subscription status updates on successful retry
- Comprehensive error codes for different failure scenarios

**Supported Error Handling:**

- Card declined
- Insufficient funds
- Expired card
- Processing errors
- Network issues

### 6. Enhanced Billing Types

**File:** `src/types/billing.ts`

**New Interfaces:**

- `BillingNotificationPreferences` - Email notification settings
- `PaymentFailure` - Failed payment tracking
- `BillingAlert` - In-app billing alerts
- `WebhookLog` - Webhook event logging
- `BillingEmailData` - Email template data
- `SubscriptionUpdate` - Real-time subscription updates
- `BillingAnalytics` - Comprehensive billing metrics

## Setup Instructions

### 1. Environment Variables

Add the following environment variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend Configuration
RESEND_API_KEY=re_...

# Monitoring API Key (generate a secure random string)
MONITORING_API_KEY=your_secure_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Database Schema Updates

The system requires a `webhook_logs` table for debugging. Run this migration when you have write access:

```sql
-- Create webhook_logs table for tracking webhook events
CREATE TABLE webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only
CREATE POLICY "Service role can manage webhook logs" ON webhook_logs
    FOR ALL USING (auth.role() = 'service_role');
```

### 3. Stripe Webhook Configuration

Configure your Stripe webhook endpoint to send the following events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`
- `invoice.upcoming`
- `customer.subscription.trial_will_end`

**Webhook URL:** `https://yourdomain.com/api/billing/webhook`

### 4. Monitoring Setup

For automated subscription monitoring, set up a cron job or scheduled task:

```bash
# Example cron job (runs every 6 hours)
0 */6 * * * curl -X POST \
  -H "Authorization: Bearer YOUR_MONITORING_API_KEY" \
  https://yourdomain.com/api/billing/monitor
```

## Usage Examples

### 1. Manual Subscription Monitoring

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_MONITORING_API_KEY" \
  https://yourdomain.com/api/billing/monitor
```

### 2. Retry Failed Payment

```javascript
import { retryFailedPayment } from '@/store/billing/billingThunks';

// In your component
const handleRetryPayment = async (invoiceId) => {
  const result = await dispatch(retryFailedPayment({ invoiceId }));
  if (result.meta.requestStatus === 'fulfilled') {
    // Payment retry initiated successfully
  }
};
```

### 3. Update Notification Preferences

```javascript
import { updateBillingNotificationPreferences } from '@/store/billing/billingThunks';

const updatePreferences = async () => {
  await dispatch(
    updateBillingNotificationPreferences({
      emailReceipts: true,
      emailReminders: true,
      emailFailures: true,
      emailCancellations: false,
    }),
  );
};
```

### 4. Real-time Subscription Updates

```javascript
import { handleWebhookSubscriptionUpdate } from '@/store/billing/billingSlice';

// Process webhook updates in real-time (via WebSocket or polling)
dispatch(
  handleWebhookSubscriptionUpdate({
    subscriptionId: 'sub_...',
    status: 'active',
    currentPeriodEnd: '2024-02-01T00:00:00Z',
  }),
);
```

## Email Templates

All email templates are professionally designed and include:

- **Responsive Design** - Optimized for desktop and mobile
- **Brand Consistency** - Uses your company colors and styling
- **Clear Call-to-Actions** - Prominent buttons for user actions
- **Accessibility** - Text alternatives and proper contrast
- **Professional Formatting** - Clean, modern layout

## Error Handling

The system implements comprehensive error handling:

### Webhook Errors

- Invalid signatures are rejected
- Missing metadata is logged and handled gracefully
- Database failures are logged with detailed error messages
- Email failures don't block webhook processing

### Payment Errors

- Specific error messages for different failure types
- Retry logic with exponential backoff
- User-friendly error messages
- Automatic status updates

### Monitoring Errors

- Failed email sends are logged but don't stop processing
- Database connection issues are handled gracefully
- Rate limiting prevents spam
- Comprehensive error reporting

## Security Considerations

1. **Webhook Signature Verification** - All webhooks are verified with Stripe signatures
2. **API Key Protection** - Monitoring endpoints require authentication
3. **User Authorization** - Payment retries verify subscription ownership
4. **Data Sanitization** - All user inputs are validated and sanitized
5. **Rate Limiting** - Email notifications are rate-limited to prevent spam

## Monitoring and Analytics

The system provides comprehensive monitoring:

- **Webhook Success Rates** - Track webhook processing success/failure
- **Email Delivery Rates** - Monitor email notification delivery
- **Payment Recovery Rates** - Track failed payment recovery success
- **Subscription Health** - Monitor trial conversions and churn
- **Error Tracking** - Detailed logging for debugging

## Best Practices

1. **Email Frequency** - Notifications are rate-limited to prevent spam
2. **User Experience** - Clear, actionable messages with easy next steps
3. **Data Consistency** - Real-time sync between Stripe and database
4. **Error Recovery** - Graceful degradation when external services fail
5. **Performance** - Efficient database queries and caching strategies

## Troubleshooting

### Common Issues

1. **Webhook Failures**
   - Check webhook signature verification
   - Verify webhook secret configuration
   - Review webhook logs in database

2. **Email Delivery Issues**
   - Verify Resend API key configuration
   - Check domain verification in Resend
   - Review email template formatting

3. **Payment Retry Failures**
   - Verify subscription ownership
   - Check invoice status in Stripe
   - Review payment method validity

### Debugging Tools

1. **Webhook Logs** - Check `webhook_logs` table for detailed event information
2. **Monitoring Endpoint** - Use health check endpoint for system status
3. **Error Logging** - Review application logs for detailed error messages
4. **Stripe Dashboard** - Cross-reference with Stripe event logs

This enhanced billing system provides a robust, production-ready solution that handles all aspects of subscription management with industry-standard practices for error handling, user communication, and data consistency.
