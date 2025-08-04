import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { integrations } from '@/lib/constants';

const stripe = new Stripe(integrations.stripe.secretKey!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { paymentMethodId, subscriptionId } = await request.json();

    if (!paymentMethodId || !subscriptionId) {
      return NextResponse.json(
        { error: 'Missing paymentMethodId or subscriptionId' },
        { status: 400 },
      );
    }

    // Get the subscription to find the customer
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer as string;

    // Attach the new payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set it as the default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Update the subscription's default payment method
    await stripe.subscriptions.update(subscriptionId, {
      default_payment_method: paymentMethodId,
    });

    // Get any open invoices for this subscription and retry payment
    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      status: 'open',
      limit: 5,
    });

    const retryResults = [];

    for (const invoice of invoices.data) {
      if (!invoice.id) continue;

      try {
        const paidInvoice = await stripe.invoices.pay(invoice.id, {
          payment_method: paymentMethodId,
        });

        retryResults.push({
          invoiceId: invoice.id,
          success: true,
          status: paidInvoice.status,
        });
      } catch (retryError: unknown) {
        retryResults.push({
          invoiceId: invoice.id,
          success: false,
          error: retryError instanceof Error ? retryError.message : 'Payment failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully',
      retryResults,
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
    });
  } catch (error: unknown) {
    console.error('Payment retry error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Payment retry failed',
      },
      { status: 500 },
    );
  }
}
