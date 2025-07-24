import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface PendingNotification {
  id: string;
  user_id: string;
  event_type: string;
  entity_id: string;
  entity_type: string;
  message: string;
  meta: any;
  created_at: string;
  user_name: string;
  user_email: string;
  company_id: string;
}

// Email template generators
function generateJobPermissionGrantedEmail(data: any): EmailTemplate {
  const subject = `You've been granted access to "${data.jobTitle}"`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Access Granted</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .permission-badge { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 500; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #007bff;">🎉 Job Access Granted</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.recipientName}</strong>,</p>
          
          <p>Great news! <strong>${data.granterName}</strong> has granted you access to the job:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${data.jobTitle}</h3>
            <p style="margin: 0;">Permission Level: <span class="permission-badge">${data.permissionLevel.charAt(0).toUpperCase() + data.permissionLevel.slice(1)}</span></p>
          </div>
          
          <div style="text-align: center;">
            <a href="${data.jobUrl}" class="button">View Job →</a>
          </div>
          
          <p style="margin-top: 30px;">If you have any questions, feel free to reach out to your team administrator.</p>
          
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
        <div class="footer">
          <p>This email was sent by your ${data.companyName} hiring platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Job Access Granted

Hi ${data.recipientName},

Great news! ${data.granterName} has granted you access to the job: "${data.jobTitle}"

Permission Level: ${data.permissionLevel.charAt(0).toUpperCase() + data.permissionLevel.slice(1)}

You can now access this job at: ${data.jobUrl}

Best regards,
The ${data.companyName} Team
  `;

  return { subject, html, text };
}

function generateInviteAcceptedEmail(data: any): EmailTemplate {
  const subject = `${data.inviteeName} has joined your team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Member Joined</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f0f9ff; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #10b981;">🎉 New Team Member</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.inviterName}</strong>,</p>
          
          <p>Great news! <strong>${data.inviteeName}</strong> has successfully joined ${data.companyName} as ${data.role}.</p>
          
          <div style="text-align: center;">
            <a href="${data.teamUrl}" class="button">View Team →</a>
          </div>
          
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
        <div class="footer">
          <p>This email was sent by your ${data.companyName} hiring platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Team Member

Hi ${data.inviterName},

Great news! ${data.inviteeName} has successfully joined ${data.companyName} as ${data.role}.

View your team at: ${data.teamUrl}

Best regards,
The ${data.companyName} Team
  `;

  return { subject, html, text };
}

function generateInviteRejectedEmail(data: any): EmailTemplate {
  const subject = `Team invitation was declined`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation Declined</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #fef3f2; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #dc2626;">📋 Invitation Declined</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.inviterName}</strong>,</p>
          
          <p>Your team invitation to <strong>${data.inviteeName}</strong> for the role of ${data.role} was declined.</p>
          
          <p>You can send a new invitation later if you'd like to invite them again.</p>
          
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
        <div class="footer">
          <p>This email was sent by your ${data.companyName} hiring platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Invitation Declined

Hi ${data.inviterName},

Your team invitation to ${data.inviteeName} for the role of ${data.role} was declined.

You can send a new invitation later if you'd like to invite them again.

Best regards,
The ${data.companyName} Team
  `;

  return { subject, html, text };
}

function generatePermissionRevokedEmail(data: any): EmailTemplate {
  const subject = `Access removed from "${data.jobTitle}"`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Access Removed</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #fef3f2; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #dc2626;">🔒 Job Access Removed</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.recipientName}</strong>,</p>
          
          <p>Your access to <strong>"${data.jobTitle}"</strong> has been removed by ${data.revokerName}.</p>
          
          <p>If you believe this was done in error, please contact your team administrator.</p>
          
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
        <div class="footer">
          <p>This email was sent by your ${data.companyName} hiring platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Job Access Removed

Hi ${data.recipientName},

Your access to "${data.jobTitle}" has been removed by ${data.revokerName}.

If you believe this was done in error, please contact your team administrator.

Best regards,
The ${data.companyName} Team
  `;

  return { subject, html, text };
}

// Helper functions
function getJobUrl(
  jobId: string,
  baseUrl: string = Deno.env.get('APP_URL') || 'http://localhost:3000',
): string {
  return `${baseUrl}/dashboard/jobs/${jobId}`;
}

function getTeamUrl(baseUrl: string = Deno.env.get('APP_URL') || 'http://localhost:3000'): string {
  return `${baseUrl}/dashboard/teams`;
}

function formatUserName(firstName: string, lastName?: string): string {
  return `${firstName}${lastName ? ` ${lastName}` : ''}`;
}

function getCompanyName(companyName?: string): string {
  return companyName || 'Your Company';
}

// Email sending function
async function sendEmail(to: string, template: EmailTemplate): Promise<any> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('EMAIL_FROM') || 'no-reply@intavia.ai';

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not found. Skipping email send.');
    return { success: true, messageId: 'dev-mode' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to send email: ${result.message || 'Unknown error'}`);
  }

  return result;
}

// Process notifications
async function processNotifications(supabase: any): Promise<number> {
  console.log('Fetching pending notifications...');

  // Get pending notifications
  const { data: notifications, error } = await supabase
    .from('pending_email_notifications')
    .select('*')
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  if (!notifications || notifications.length === 0) {
    console.log('No pending notifications to process');
    return 0;
  }

  console.log(`Processing ${notifications.length} pending notifications...`);
  let processedCount = 0;

  for (const notification of notifications) {
    try {
      await processNotification(supabase, notification);
      processedCount++;

      // Mark as processed
      await supabase
        .from('user_activities')
        .update({
          meta: {
            ...notification.meta,
            should_send_email: false,
            email_sent_at: new Date().toISOString(),
            email_processed: true,
          },
        })
        .eq('id', notification.id);
    } catch (error) {
      console.error(`Failed to process notification ${notification.id}:`, error);

      // Mark as failed
      await supabase
        .from('user_activities')
        .update({
          meta: {
            ...notification.meta,
            should_send_email: false,
            email_failed_at: new Date().toISOString(),
            email_error: error.message,
          },
        })
        .eq('id', notification.id);
    }
  }

  console.log(`Successfully processed ${processedCount} notifications`);
  return processedCount;
}

async function processNotification(
  supabase: any,
  notification: PendingNotification,
): Promise<void> {
  const { event_type, meta } = notification;

  // Get company details
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', notification.company_id)
    .single();

  const companyName = getCompanyName(company?.name);

  let template: EmailTemplate;
  let recipientEmail: string;

  switch (event_type) {
    case 'job_permission_granted':
      template = generateJobPermissionGrantedEmail({
        recipientName: meta.user_name,
        granterName: meta.granted_by_name,
        jobTitle: meta.job_title,
        permissionLevel: meta.permission_level,
        companyName,
        jobUrl: getJobUrl(meta.job_id),
      });
      recipientEmail = meta.user_email;
      break;

    case 'job_permission_revoked':
      template = generatePermissionRevokedEmail({
        recipientName: meta.user_name,
        revokerName: meta.revoked_by_name,
        jobTitle: meta.job_title,
        permissionLevel: meta.permission_level,
        companyName,
      });
      recipientEmail = meta.user_email;
      break;

    case 'team_invite_accepted':
      template = generateInviteAcceptedEmail({
        inviterName: notification.user_name,
        inviteeName: meta.invitee_name,
        role: meta.role,
        companyName,
        teamUrl: getTeamUrl(),
      });
      recipientEmail = notification.user_email;
      break;

    case 'team_invite_rejected':
      template = generateInviteRejectedEmail({
        inviterName: notification.user_name,
        inviteeName: meta.invitee_name,
        role: meta.role,
        companyName,
      });
      recipientEmail = notification.user_email;
      break;

    default:
      console.warn(`Unknown event type: ${event_type}`);
      return;
  }

  // Send the email
  const result = await sendEmail(recipientEmail, template);
  console.log(`Email sent for ${event_type} to ${recipientEmail}:`, result.id);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process all pending notifications
    const processedCount = await processNotifications(supabase);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} email notifications`,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error processing notifications:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
