# Stripe Webhook Setup Guide

## 🎯 Overview

Webhooks are essential for keeping your application's subscription data in sync with Stripe. They handle events like successful payments, subscription updates, and cancellations.

## 📋 Required Webhook Events

### Core Events (Required)

- ✅ `checkout.session.completed` - When a user completes checkout
- ✅ `customer.subscription.updated` - When subscription details change
- ✅ `customer.subscription.deleted` - When subscription is canceled
- ✅ `invoice.payment_succeeded` - When payment is successful
- ✅ `invoice.payment_failed` - When payment fails

### Optional Events

- `customer.subscription.trial_will_end` - 3 days before trial ends
- `invoice.upcoming` - Before next billing cycle

## 🛠️ Setup Steps

### 1. Access Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Navigate to **Developers** → **Webhooks**

### 2. Create Webhook Endpoint

1. Click **"Add endpoint"**
2. **Endpoint URL**: `https://yourdomain.com/api/billing/webhook`
   - For local development: Use ngrok or similar
   - For production: Your actual domain
3. **Events to send**: Select the events listed above
4. Click **"Add endpoint"**

### 3. Get Webhook Secret

1. After creating the endpoint, click on it
2. Copy the **Signing secret** (starts with `whsec_`)
3. Add it to your `.env` file:
   ```env
   NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### 4. Test Webhook

1. In the webhook details page, click **"Send test webhook"**
2. Select `checkout.session.completed`
3. Click **"Send test webhook"**
4. Check your application logs for the webhook event

## 🔧 Local Development Setup

### Using ngrok (Recommended)

1. Install ngrok: `npm install -g ngrok`
2. Start your Next.js app: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Use this URL in Stripe webhook endpoint: `https://abc123.ngrok.io/api/billing/webhook`

### Alternative: Stripe CLI

1. Install Stripe CLI
2. Run: `stripe listen --forward-to localhost:3000/api/billing/webhook`
3. Copy the webhook secret from the output

## 🧪 Testing Webhooks

### Test Checkout Flow

1. Complete a test checkout in your app
2. Check your application logs for webhook events
3. Verify subscription is created in your database

### Test Subscription Updates

1. Go to Stripe Dashboard → Customers
2. Find your test customer
3. Update their subscription (cancel, change plan, etc.)
4. Check your app logs for webhook events

### Manual Webhook Testing

1. In Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select different event types to test

## 📊 Monitoring Webhooks

### Check Webhook Status

1. Stripe Dashboard → Webhooks → Your endpoint
2. View **"Recent deliveries"** tab
3. Check for failed deliveries (red indicators)

### Application Logs

Monitor your application logs for webhook events:

```bash
# Check Next.js logs
npm run dev

# Check for webhook errors
grep -i "webhook" logs/
```

### Common Issues

- **404 Errors**: Webhook URL not accessible
- **401 Errors**: Invalid webhook secret
- **500 Errors**: Application error processing webhook

## 🔐 Security Best Practices

### Webhook Verification

- ✅ Always verify webhook signatures
- ✅ Use HTTPS endpoints only
- ✅ Keep webhook secrets secure

### Error Handling

- ✅ Log all webhook events
- ✅ Handle webhook failures gracefully
- ✅ Implement retry logic for failed events

## 🚀 Production Deployment

### 1. Update Webhook URL

1. Deploy your application
2. Update webhook endpoint URL to production domain
3. Test webhook delivery

### 2. Environment Variables

```env
# Production
NEXT_PUBLIC_STRIPE_SECRET=sk_live_...
NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET=whsec_live_...
```

### 3. Monitoring

- Set up alerts for webhook failures
- Monitor webhook delivery rates
- Check application logs regularly

## 🐛 Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is accessible
2. Verify webhook secret is correct
3. Check application logs for errors
4. Test with Stripe CLI

### Database Not Updating

1. Check webhook handler logs
2. Verify database connection
3. Check for SQL errors
4. Test webhook manually

### Subscription Status Issues

1. Check webhook event processing
2. Verify subscription data mapping
3. Check for duplicate events
4. Review webhook handler logic

## 📞 Support

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- Contact: support@intavia.app
