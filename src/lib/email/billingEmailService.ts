import { Resend } from 'resend';
import { integrations, domainEmails, app } from '../constants';

const resend = new Resend(integrations.resend.apiKey);

export interface BillingEmailData {
  type:
    | 'subscription_created'
    | 'subscription_cancelled'
    | 'subscription_ended'
    | 'payment_failed'
    | 'payment_receipt'
    | 'payment_reminder'
    | 'trial_ending'
    | 'plan_changed';
  to: string;
  data: Record<string, any>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email templates
const emailTemplates = {
  subscription_created: {
    subject: 'Welcome to your new subscription!',
    generateHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Subscription Confirmed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Your Subscription!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>Thank you for subscribing to our <strong>${data.planName}</strong> plan! Your subscription is now active.</p>
            
            <h3>Subscription Details:</h3>
            <ul>
              <li><strong>Plan:</strong> ${data.planName}</li>
              <li><strong>Company:</strong> ${data.companyName}</li>
              <li><strong>Subscription ID:</strong> ${data.subscriptionId}</li>
              <li><strong>Next Billing Date:</strong> ${new Date(data.nextBillingDate).toLocaleDateString()}</li>
            </ul>
            
            <p>You can manage your subscription, view invoices, and update payment methods at any time through your billing dashboard.</p>
            
            <a href="${app.baseUrl}/dashboard/settings?tab=billing" class="button">Manage Subscription</a>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Intavia Team</p>
          </div>
          <div class="footer">
            <p>This email was sent regarding your subscription at ${data.companyName}.</p>
          </div>
        </body>
      </html>
    `,
    generateText: (data: any) => `
      Welcome to Your Subscription!
      
      Hi ${data.customerName},
      
      Thank you for subscribing to our ${data.planName} plan! Your subscription is now active.
      
      Subscription Details:
      - Plan: ${data.planName}
      - Company: ${data.companyName}
      - Subscription ID: ${data.subscriptionId}
      - Next Billing Date: ${new Date(data.nextBillingDate).toLocaleDateString()}
      
      You can manage your subscription, view invoices, and update payment methods at any time through your billing dashboard: ${app.baseUrl}/dashboard/settings?tab=billing
      
      If you have any questions, please don't hesitate to contact our support team.
      
      Best regards,
      The Intavia Team
    `,
  },

  payment_receipt: {
    subject: 'Payment Receipt - Subscription Renewed',
    generateHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .receipt-box { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Successful!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>Thank you for your payment! Your subscription has been successfully renewed.</p>
            
            <div class="receipt-box">
              <h3>Payment Details:</h3>
              <ul>
                <li><strong>Amount:</strong> ${data.currency} ${data.amount}</li>
                <li><strong>Payment Date:</strong> ${new Date(data.paymentDate).toLocaleDateString()}</li>
                <li><strong>Invoice ID:</strong> ${data.invoiceId}</li>
                <li><strong>Subscription ID:</strong> ${data.subscriptionId}</li>
                ${data.nextBillingDate ? `<li><strong>Next Billing Date:</strong> ${new Date(data.nextBillingDate).toLocaleDateString()}</li>` : ''}
              </ul>
            </div>
            
            ${data.receiptUrl ? `<a href="${data.receiptUrl}" class="button">Download Receipt</a>` : ''}
            <a href="${app.baseUrl}/dashboard/settings?tab=billing" class="button">View Billing Dashboard</a>
            
            <p>If you have any questions about this payment, please contact our support team.</p>
            
            <p>Best regards,<br>The Intavia Team</p>
          </div>
          <div class="footer">
            <p>This receipt was sent to ${data.customerName} at ${data.companyName}.</p>
          </div>
        </body>
      </html>
    `,
    generateText: (data: any) => `
      Payment Successful!
      
      Hi ${data.customerName},
      
      Thank you for your payment! Your subscription has been successfully renewed.
      
      Payment Details:
      - Amount: ${data.currency} ${data.amount}
      - Payment Date: ${new Date(data.paymentDate).toLocaleDateString()}
      - Invoice ID: ${data.invoiceId}
      - Subscription ID: ${data.subscriptionId}
      ${data.nextBillingDate ? `- Next Billing Date: ${new Date(data.nextBillingDate).toLocaleDateString()}` : ''}
      
      ${data.receiptUrl ? `Download Receipt: ${data.receiptUrl}` : ''}
      View Billing Dashboard: ${app.baseUrl}/dashboard/settings?tab=billing
      
      If you have any questions about this payment, please contact our support team.
      
      Best regards,
      The Intavia Team
    `,
  },

  payment_failed: {
    subject: 'Payment Failed - Action Required',
    generateHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Failed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Failed</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>We were unable to process your payment for your subscription. Please update your payment method to avoid service interruption.</p>
            
            <div class="alert-box">
              <h3>Payment Details:</h3>
              <ul>
                <li><strong>Amount:</strong> ${data.currency} ${data.amount}</li>
                <li><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</li>
                <li><strong>Invoice ID:</strong> ${data.invoiceId}</li>
                <li><strong>Subscription ID:</strong> ${data.subscriptionId}</li>
              </ul>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <p>Your subscription is currently in a past-due state. We'll retry the payment automatically, but to ensure uninterrupted service, please update your payment method or pay the outstanding invoice.</p>
            
            ${data.paymentUrl ? `<a href="${data.paymentUrl}" class="button">Pay Now</a>` : ''}
            <a href="${app.baseUrl}/dashboard/settings?tab=billing" class="button">Update Payment Method</a>
            
            <p>If you continue to experience issues, please contact our support team for assistance.</p>
            
            <p>Best regards,<br>The Intavia Team</p>
          </div>
          <div class="footer">
            <p>This notice was sent to ${data.customerName} at ${data.companyName}.</p>
          </div>
        </body>
      </html>
    `,
    generateText: (data: any) => `
      Payment Failed - Action Required
      
      Hi ${data.customerName},
      
      We were unable to process your payment for your subscription. Please update your payment method to avoid service interruption.
      
      Payment Details:
      - Amount: ${data.currency} ${data.amount}
      - Due Date: ${new Date(data.dueDate).toLocaleDateString()}
      - Invoice ID: ${data.invoiceId}
      - Subscription ID: ${data.subscriptionId}
      
      What happens next?
      Your subscription is currently in a past-due state. We'll retry the payment automatically, but to ensure uninterrupted service, please update your payment method or pay the outstanding invoice.
      
      ${data.paymentUrl ? `Pay Now: ${data.paymentUrl}` : ''}
      Update Payment Method: ${app.baseUrl}/dashboard/settings?tab=billing
      
      If you continue to experience issues, please contact our support team for assistance.
      
      Best regards,
      The Intavia Team
    `,
  },

  payment_reminder: {
    subject: 'Upcoming Payment Reminder',
    generateHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .reminder-box { background: #fffbeb; border: 1px solid #fed7aa; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>This is a friendly reminder that your subscription payment is coming up soon.</p>
            
            <div class="reminder-box">
              <h3>Upcoming Payment:</h3>
              <ul>
                <li><strong>Amount:</strong> ${data.currency} ${data.amount}</li>
                <li><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</li>
                <li><strong>Subscription ID:</strong> ${data.subscriptionId}</li>
              </ul>
            </div>
            
            <p>We'll automatically charge your payment method on file. If you need to update your payment information, you can do so in your billing dashboard.</p>
            
            <a href="${app.baseUrl}/dashboard/settings?tab=billing" class="button">View Billing Dashboard</a>
            
            <p>Thank you for being a valued customer!</p>
            
            <p>Best regards,<br>The Intavia Team</p>
          </div>
          <div class="footer">
            <p>This reminder was sent to ${data.customerName} at ${data.companyName}.</p>
          </div>
        </body>
      </html>
    `,
    generateText: (data: any) => `
      Payment Reminder
      
      Hi ${data.customerName},
      
      This is a friendly reminder that your subscription payment is coming up soon.
      
      Upcoming Payment:
      - Amount: ${data.currency} ${data.amount}
      - Due Date: ${new Date(data.dueDate).toLocaleDateString()}
      - Subscription ID: ${data.subscriptionId}
      
      We'll automatically charge your payment method on file. If you need to update your payment information, you can do so in your billing dashboard.
      
      View Billing Dashboard: ${app.baseUrl}/dashboard/settings?tab=billing
      
      Thank you for being a valued customer!
      
      Best regards,
      The Intavia Team
    `,
  },

  subscription_cancelled: {
    subject: 'Subscription Cancellation Confirmed',
    generateHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Subscription Cancelled</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6b7280; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Subscription Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>We've confirmed the cancellation of your subscription. Your access will continue until the end of your current billing period.</p>
            
            <div class="info-box">
              <h3>Cancellation Details:</h3>
              <ul>
                <li><strong>Subscription ID:</strong> ${data.subscriptionId}</li>
                <li><strong>Cancellation Date:</strong> ${new Date(data.cancellationDate).toLocaleDateString()}</li>
                <li><strong>Access Until:</strong> ${new Date(data.cancellationDate).toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>You can reactivate your subscription at any time before the end of your billing period to continue enjoying our services without interruption.</p>
            
            <a href="${app.baseUrl}/dashboard/settings?tab=billing" class="button">Reactivate Subscription</a>
            
            <p>We're sorry to see you go! If you have any feedback about your experience or if there's anything we could have done better, please let us know.</p>
            
            <p>Best regards,<br>The Intavia Team</p>
          </div>
          <div class="footer">
            <p>This confirmation was sent to ${data.customerName} at ${data.companyName}.</p>
          </div>
        </body>
      </html>
    `,
    generateText: (data: any) => `
      Subscription Cancelled
      
      Hi ${data.customerName},
      
      We've confirmed the cancellation of your subscription. Your access will continue until the end of your current billing period.
      
      Cancellation Details:
      - Subscription ID: ${data.subscriptionId}
      - Cancellation Date: ${new Date(data.cancellationDate).toLocaleDateString()}
      - Access Until: ${new Date(data.cancellationDate).toLocaleDateString()}
      
      You can reactivate your subscription at any time before the end of your billing period to continue enjoying our services without interruption.
      
      Reactivate Subscription: ${app.baseUrl}/dashboard/settings?tab=billing
      
      We're sorry to see you go! If you have any feedback about your experience or if there's anything we could have done better, please let us know.
      
      Best regards,
      The Intavia Team
    `,
  },

  subscription_ended: {
    subject: 'Subscription Ended',
    generateHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Subscription Ended</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6b7280; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Subscription Ended</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>Your subscription has ended and your access to premium features has been disabled.</p>
            
            <p><strong>Subscription ID:</strong> ${data.subscriptionId}</p>
            
            <p>We hope you enjoyed using our service! If you'd like to continue, you can start a new subscription at any time.</p>
            
            <a href="${app.baseUrl}/pricing" class="button">View Plans</a>
            <a href="${app.baseUrl}/dashboard/settings?tab=billing" class="button">Billing Dashboard</a>
            
            <p>Thank you for being part of our community. We'd love to have you back!</p>
            
            <p>Best regards,<br>The Intavia Team</p>
          </div>
          <div class="footer">
            <p>This notification was sent to ${data.customerName} at ${data.companyName}.</p>
          </div>
        </body>
      </html>
    `,
    generateText: (data: any) => `
      Subscription Ended
      
      Hi ${data.customerName},
      
      Your subscription has ended and your access to premium features has been disabled.
      
      Subscription ID: ${data.subscriptionId}
      
      We hope you enjoyed using our service! If you'd like to continue, you can start a new subscription at any time.
      
      View Plans: ${app.baseUrl}/pricing
      Billing Dashboard: ${app.baseUrl}/dashboard/settings?tab=billing
      
      Thank you for being part of our community. We'd love to have you back!
      
      Best regards,
      The Intavia Team
    `,
  },

  trial_ending: {
    subject: 'Trial Ending Soon - Choose Your Plan',
    generateHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Trial Ending</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .trial-box { background: #fffbeb; border: 1px solid #fed7aa; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Trial Ending Soon</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>Your trial period is ending soon. To continue using our premium features, please choose a subscription plan.</p>
            
            <div class="trial-box">
              <h3>Trial Information:</h3>
              <ul>
                <li><strong>Trial End Date:</strong> ${new Date(data.trialEndDate).toLocaleDateString()}</li>
                <li><strong>Subscription ID:</strong> ${data.subscriptionId}</li>
              </ul>
            </div>
            
            <p>Don't lose access to the powerful features you've been using. Choose a plan that fits your needs and continue your journey with us.</p>
            
            <a href="${app.baseUrl}/pricing" class="button">Choose Your Plan</a>
            <a href="${app.baseUrl}/dashboard/settings?tab=billing" class="button">Billing Dashboard</a>
            
            <p>If you have any questions about our plans or need help choosing the right one, our support team is here to help.</p>
            
            <p>Best regards,<br>The Intavia Team</p>
          </div>
          <div class="footer">
            <p>This reminder was sent to ${data.customerName} at ${data.companyName}.</p>
          </div>
        </body>
      </html>
    `,
    generateText: (data: any) => `
      Trial Ending Soon
      
      Hi ${data.customerName},
      
      Your trial period is ending soon. To continue using our premium features, please choose a subscription plan.
      
      Trial Information:
      - Trial End Date: ${new Date(data.trialEndDate).toLocaleDateString()}
      - Subscription ID: ${data.subscriptionId}
      
      Don't lose access to the powerful features you've been using. Choose a plan that fits your needs and continue your journey with us.
      
      Choose Your Plan: ${app.baseUrl}/pricing
      Billing Dashboard: ${app.baseUrl}/dashboard/settings?tab=billing
      
      If you have any questions about our plans or need help choosing the right one, our support team is here to help.
      
      Best regards,
      The Intavia Team
    `,
  },

  plan_changed: {
    subject: 'Your subscription plan has been updated',
    generateHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Plan Changed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .plan-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${data.isUpgrade ? 'Plan Upgraded!' : 'Plan Updated'}</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>Your subscription plan has been successfully ${data.isUpgrade ? 'upgraded' : 'changed'}!</p>
            
            <div class="plan-box">
              <h3>Plan Change Details:</h3>
              <ul>
                ${data.oldPlanName ? `<li><strong>Previous Plan:</strong> ${data.oldPlanName}</li>` : ''}
                <li><strong>New Plan:</strong> ${data.planName}</li>
                <li><strong>Amount:</strong> $${data.amount}</li>
                <li><strong>Next Billing Date:</strong> ${data.nextBillingDate}</li>
              </ul>
            </div>
            
            <p>${data.isUpgrade ? 'Welcome to your enhanced plan! You now have access to additional features and capabilities.' : 'Your plan has been updated as requested.'}</p>
            
            <a href="${app.baseUrl}/billing" class="button">Manage Subscription</a>
            <a href="${app.baseUrl}/dashboard" class="button">Go to Dashboard</a>
            
            <p>If you have any questions about your new plan or need assistance, don't hesitate to reach out to our support team.</p>
            
            <p>Thank you for choosing Intavia!</p>
            <p>Best regards,<br>The Intavia Team</p>
          </div>
          <div class="footer">
            <p>This notification was sent to ${data.customerName}.</p>
          </div>
        </body>
      </html>
    `,
    generateText: (data: any) => `
      ${data.isUpgrade ? 'Plan Upgraded!' : 'Plan Updated'}
      
      Hi ${data.customerName},
      
      Your subscription plan has been successfully ${data.isUpgrade ? 'upgraded' : 'changed'}!
      
      Plan Change Details:
      ${data.oldPlanName ? `Previous Plan: ${data.oldPlanName}` : ''}
      New Plan: ${data.planName}
      Amount: $${data.amount}
      Next Billing Date: ${data.nextBillingDate}
      
      ${data.isUpgrade ? 'Welcome to your enhanced plan! You now have access to additional features and capabilities.' : 'Your plan has been updated as requested.'}
      
      Manage Subscription: ${app.baseUrl}/billing
      Go to Dashboard: ${app.baseUrl}/dashboard
      
      If you have any questions about your new plan or need assistance, don't hesitate to reach out to our support team.
      
      Thank you for choosing Intavia!
      Best regards,
      The Intavia Team
      
      This notification was sent to ${data.customerName}.
    `,
  },
};

export async function sendBillingEmail({
  type,
  to,
  data,
}: BillingEmailData): Promise<EmailSendResult> {
  try {
    if (!integrations.resend.apiKey) {
      console.warn('RESEND_API_KEY not found. Email would be sent in production.');
      return { success: true, messageId: 'dev-mode' };
    }

    const template = emailTemplates[type];
    if (!template) {
      console.error('Unknown email template type:', type);
      throw new Error(`Unknown email template type: ${type}`);
    }

    const htmlContent = template.generateHtml(data);
    const textContent = template.generateText(data);

    const result = await resend.emails.send({
      from: domainEmails.noReply,
      to,
      subject: template.subject,
      html: htmlContent,
      text: textContent,
      replyTo: domainEmails.noReply,
    });

    console.log('✅ Billing email sent successfully:', template.subject, 'to', to);
    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('❌ Failed to send billing email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Utility function to send multiple billing emails
export async function sendBulkBillingEmails(
  emails: BillingEmailData[],
): Promise<EmailSendResult[]> {
  const results = await Promise.allSettled(emails.map((email) => sendBillingEmail(email)));

  return results.map((result) =>
    result.status === 'fulfilled'
      ? result.value
      : { success: false, error: result.reason?.message || 'Unknown error' },
  );
}
