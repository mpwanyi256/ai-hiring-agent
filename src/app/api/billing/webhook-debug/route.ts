import { NextRequest, NextResponse } from 'next/server';
import { integrations, isDev } from '@/lib/constants';

export async function GET(request: NextRequest) {
  // Only allow in development or with proper authorization
  const authHeader = request.headers.get('authorization');
  const isAuthorized = authHeader === `Bearer ${process.env.WEBHOOK_DEBUG_SECRET}` || isDev;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);

  const debugInfo = {
    environment: {
      isDev,
      nodeEnv: process.env.NODE_ENV,
      clientEnv: process.env.NEXT_PUBLIC_CLIENT_ENV,
    },
    stripe: {
      hasSecretKey: !!integrations.stripe.secretKey,
      secretKeyPrefix: integrations.stripe.secretKey?.substring(0, 7) + '...',
      hasPublishableKey: !!integrations.stripe.publishableKey,
      publishableKeyPrefix: integrations.stripe.publishableKey?.substring(0, 7) + '...',
      hasWebhookSecret: !!integrations.stripe.webhookSecret,
      webhookSecretPrefix: integrations.stripe.webhookSecret?.substring(0, 10) + '...',
      webhookSecretLength: integrations.stripe.webhookSecret?.length || 0,
    },
    url: {
      fullUrl: url.toString(),
      origin: url.origin,
      hostname: url.hostname,
    },
    environmentVariables: {
      stripeSecretTest: !!process.env.NEXT_PUBLIC_STRIPE_SECRET_TEST,
      stripeSecret: !!process.env.NEXT_PUBLIC_STRIPE_SECRET,
      stripeWebhookSecretTest: !!process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET_TEST,
      stripeWebhookSecret: !!process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET,
    },
    recommendations: [],
  };

  // Add recommendations based on findings
  if (!integrations.stripe.webhookSecret) {
    debugInfo.recommendations.push('Webhook secret is missing. Check your environment variables.');
  }

  if (!integrations.stripe.secretKey) {
    debugInfo.recommendations.push(
      'Stripe secret key is missing. Check your environment variables.',
    );
  }

  if (integrations.stripe.webhookSecret?.length < 32) {
    debugInfo.recommendations.push(
      "Webhook secret seems too short. Make sure you're using the full webhook endpoint secret from Stripe.",
    );
  }

  if (isDev && !process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET_TEST) {
    debugInfo.recommendations.push(
      'Development webhook secret (NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET_TEST) is missing.',
    );
  }

  if (!isDev && !process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET) {
    debugInfo.recommendations.push(
      'Production webhook secret (NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET) is missing.',
    );
  }

  return NextResponse.json(debugInfo, { status: 200 });
}
