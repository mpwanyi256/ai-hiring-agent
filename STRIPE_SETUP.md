# Stripe Customer Portal Setup Guide

## Issue

The billing portal is showing an error: "No configuration provided and your test mode default configuration has not been created."

## Solution

You need to configure the Stripe Customer Portal in your Stripe Dashboard.

## Steps to Fix

### 1. Access Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in the top right)
3. Navigate to **Settings** → **Billing** → **Customer portal**

### 2. Configure Customer Portal

1. Click **"Configure"** or **"Set up customer portal"**
2. Configure the following settings:

#### Basic Settings

- **Business information**: Add your company name and logo
- **Branding**: Customize colors and styling (optional)

#### Portal Features

Enable these features:

- ✅ **Cancel subscription**
- ✅ **Update payment method**
- ✅ **Download invoices**
- ✅ **Update billing information**
- ✅ **View billing history**

#### Business Settings

- **Default return URL**: `https://yourdomain.com/dashboard/billing`
- **Customer update**: Allow customers to update their information

### 3. Save Configuration

1. Click **"Save"** to activate the customer portal
2. The portal will now be available for your customers

## Test the Fix

1. Go back to your application
2. Try clicking "Manage Billing" again
3. You should now be redirected to the Stripe customer portal

## Production Setup

When you're ready for production:

1. Switch to **Live Mode** in Stripe Dashboard
2. Repeat the same configuration steps
3. Update your environment variables to use live keys

## Alternative: Manual Subscription Management

If you prefer not to use the customer portal, you can:

1. Disable the "Manage Billing" button
2. Provide support contact for subscription changes
3. Handle cancellations/upgrades manually through Stripe Dashboard

## Support

If you need help with Stripe configuration:

- [Stripe Customer Portal Documentation](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Support](https://support.stripe.com)
