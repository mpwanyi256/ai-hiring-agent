# Billing Setup Guide

This guide walks you through setting up the enhanced billing system with Stripe webhooks, email notifications, and in-app notifications.

## 1. Environment Variables Setup

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe Webhook settings

# Resend Email Configuration (from Resend Dashboard)
RESEND_API_KEY=re_...

# Custom Monitoring API Key (generate your own)
# Use this to protect the subscription monitoring endpoint
# Generate with: openssl rand -base64 32
MONITORING_API_KEY=your_generated_secure_key_here
```

### 🔐 MONITORING_API_KEY Setup

**Important**: The `MONITORING_API_KEY` is **NOT from Stripe**. It's a custom API key you create to protect your monitoring endpoints.

**Generate it using one of these methods:**

```bash
# Option 1: OpenSSL (recommended)
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online tool (use with caution)
# Visit: https://generate.plus/en/base64
```

**Example output:**

```
YourRandomGeneratedKey123456789abcdef=
```

**Add to your `.env.local`:**

```bash
MONITORING_API_KEY=YourRandomGeneratedKey123456789abcdef=
```

## 2. Stripe Dashboard Configuration

### Setting up Webhooks

**Important:** The webhook endpoint now accepts the signing key as a query parameter to accommodate Stripe's limitations with custom headers.

1. **Go to Stripe Dashboard** → **Developers** → **Webhooks**
2. **Click "Add endpoint"**
3. **Enter your endpoint URL with the signing key parameter:**

   ```
   https://your-domain.com/api/billing/webhook?key=YOUR_WEBHOOK_SIGNING_SECRET
   ```

   **Note:** You'll get the signing secret in step 5, then you'll need to update this URL.

4. **Select these events to listen for:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.upcoming`

5. **After creating the webhook:**
   - Copy the webhook signing secret (starts with `whsec_`)
   - **Edit your webhook endpoint URL** to include the secret:
     ```
     https://your-domain.com/api/billing/webhook?key=whsec_your_actual_secret_here
     ```
   - **Save the updated webhook URL**

6. **Optional:** Add the webhook secret to your `.env.local` as `STRIPE_WEBHOOK_SECRET` for fallback support

### Why Query Parameters?

Stripe webhooks don't support custom headers, so we pass the signing key as a URL parameter. The webhook handler will:

- First check for the signing key in the `key` query parameter
- Fall back to the `STRIPE_WEBHOOK_SECRET` environment variable if needed
- Validate the webhook signature using the provided key

### Setting up Products and Prices

1. **Go to Stripe Dashboard** → **Products**
2. **Create your subscription plans** with pricing
3. **Note the Price IDs** - you'll need these in your application

## 3. Supabase Configuration

### Apply Database Migrations

Run the migration to set up the billing notification system:

```bash
cd ai-hiring-agent
supabase db push --include-all
```

This creates:

- `billing_notification_preferences` table
- `webhook_logs` table for debugging
- Notification triggers for subscription events
- Helper functions for billing notifications

### Environment Variables in Supabase

Make sure these are set in your Supabase project settings:

- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- `MONITORING_API_KEY`

## 4. Resend Email Configuration

### Get Your Resend API Key

1. **Go to [Resend Dashboard](https://resend.com/api-keys)**
2. **Create an API key**
3. **Add to your `.env.local` as `RESEND_API_KEY`**

### Configure Domain (Optional)

For production, configure your sending domain in Resend for better deliverability.

## 5. Testing the Setup

### Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your local server with query parameter
# The Stripe CLI will provide a webhook signing secret for testing
stripe listen --forward-to localhost:3000/api/billing/webhook?key=whsec_test_secret_from_cli

# Alternative: Use environment variable approach (fallback)
stripe listen --forward-to localhost:3000/api/billing/webhook

# Copy the webhook signing secret provided by the CLI and use it in your URL
```

**Note:** When using Stripe CLI for local testing, you have two options:

1. **Query Parameter (Recommended):** Include the test signing secret in the URL
2. **Environment Variable:** Set `STRIPE_WEBHOOK_SECRET` in your `.env.local`

### Test Subscription Monitoring

```bash
# Test the monitoring endpoint (replace with your actual key)
curl -X POST http://localhost:3000/api/billing/monitor \
  -H "Authorization: Bearer YourRandomGeneratedKey123456789abcdef=" \
  -H "Content-Type: application/json"
```

Expected response:

```json
{
  "success": true,
  "summary": {
    "totalNotifications": 0,
    "errors": 0
  }
}
```

## 6. Production Deployment

### Environment Variables

Ensure these are set in your production environment:

- `STRIPE_SECRET_KEY` (use live key)
- `STRIPE_PUBLISHABLE_KEY` (use live key)
- `STRIPE_WEBHOOK_SECRET` (from production webhook)
- `RESEND_API_KEY`
- `MONITORING_API_KEY`

### Webhook Endpoint

Update your Stripe webhook endpoint URL to point to your production domain:

```
https://your-production-domain.com/api/billing/webhook
```

### Security Considerations

1. **Keep your MONITORING_API_KEY secure** - treat it like a password
2. **Use HTTPS** for all webhook endpoints
3. **Verify webhook signatures** (already implemented)
4. **Monitor webhook logs** for failed events

## 7. Monitoring and Maintenance

### Webhook Logs

Monitor webhook processing via the `webhook_logs` table:

```sql
SELECT event_type, status, created_at, error_message
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 50;
```

### Failed Webhooks

Check for failed webhook events:

```sql
SELECT * FROM webhook_logs
WHERE status = 'error'
ORDER BY created_at DESC;
```

### Subscription Health

Monitor subscription statuses:

```sql
SELECT status, COUNT(*) as count
FROM user_subscriptions
GROUP BY status;
```

## 8. Automation (Optional)

### Cron Job for Monitoring

Set up a cron job to run subscription monitoring checks:

```bash
# Add to crontab (runs every hour)
0 * * * * curl -X POST https://your-domain.com/api/billing/monitor -H "Authorization: Bearer YourRandomGeneratedKey123456789abcdef=" > /dev/null 2>&1
```

### Vercel Cron (for Vercel deployments)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/billing/monitor",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## 🚀 You're All Set!

Your billing system now includes:

- ✅ Comprehensive webhook handling
- ✅ Automated email notifications
- ✅ In-app notifications
- ✅ Subscription monitoring
- ✅ Payment retry functionality
- ✅ Industry-standard error handling

## Support

If you encounter issues:

1. Check webhook logs in Supabase
2. Verify environment variables
3. Test webhook delivery in Stripe dashboard
4. Check Resend delivery logs

The system is designed to be resilient and will gracefully handle most edge cases automatically.
