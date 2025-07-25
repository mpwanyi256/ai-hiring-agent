import { JobPermissionLevel } from '@/types/jobPermissions';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface JobPermissionGrantedTemplateData {
  recipientName: string;
  granterName: string;
  jobTitle: string;
  permissionLevel: JobPermissionLevel;
  companyName: string;
  jobUrl: string;
}

export interface InviteAcceptedTemplateData {
  inviterName: string;
  inviteeName: string;
  role: string;
  companyName: string;
  teamUrl: string;
}

export interface InviteRejectedTemplateData {
  inviterName: string;
  inviteeName: string;
  role: string;
  companyName: string;
}

export interface PermissionRevokedTemplateData {
  recipientName: string;
  revokerName: string;
  jobTitle: string;
  permissionLevel: JobPermissionLevel;
  companyName: string;
}

export function generateJobPermissionGrantedEmail(
  data: JobPermissionGrantedTemplateData,
): EmailTemplate {
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
          
          <p>You can now access this job and perform actions based on your permission level:</p>
          
          <ul>
            ${
              data.permissionLevel === JobPermissionLevel.VIEWER
                ? '<li>View candidates and interview responses</li><li>Review evaluations and assessments</li>'
                : data.permissionLevel === JobPermissionLevel.INTERVIEWER
                  ? '<li>View candidates and interview responses</li><li>Conduct interviews and add notes</li><li>Review evaluations and assessments</li>'
                  : data.permissionLevel === JobPermissionLevel.MANAGER
                    ? '<li>Manage candidates through the hiring pipeline</li><li>Conduct interviews and evaluations</li><li>Update job status and requirements</li>'
                    : '<li>Full access to job management</li><li>Manage team permissions</li><li>Control all aspects of the hiring process</li>'
            }
          </ul>
          
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

export function generateInviteAcceptedEmail(data: InviteAcceptedTemplateData): EmailTemplate {
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
        .member-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
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
          
          <p>Great news! The team member you invited has successfully joined ${data.companyName}.</p>
          
          <div class="member-card">
            <h3 style="margin: 0 0 10px 0;">${data.inviteeName}</h3>
            <p style="margin: 0; color: #666;">Role: ${data.role}</p>
          </div>
          
          <p>They now have access to the platform and can start collaborating with your team on hiring activities.</p>
          
          <div style="text-align: center;">
            <a href="${data.teamUrl}" class="button">View Team →</a>
          </div>
          
          <p style="margin-top: 30px;">You can manage their permissions and assign them to specific jobs from the team management page.</p>
          
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

They now have access to the platform and can start collaborating with your team.

View your team at: ${data.teamUrl}

Best regards,
The ${data.companyName} Team
  `;

  return { subject, html, text };
}

export function generateInviteRejectedEmail(data: InviteRejectedTemplateData): EmailTemplate {
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
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .invite-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
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
          
          <p>We wanted to let you know that your team invitation was declined.</p>
          
          <div class="invite-card">
            <h3 style="margin: 0 0 10px 0;">${data.inviteeName}</h3>
            <p style="margin: 0; color: #666;">Invited Role: ${data.role}</p>
          </div>
          
          <p>The invited person chose not to join ${data.companyName} at this time. You can send a new invitation later if you'd like to invite them again.</p>
          
          <p style="margin-top: 30px;">If you have any questions about team invitations, please contact support.</p>
          
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

export function generatePermissionRevokedEmail(data: PermissionRevokedTemplateData): EmailTemplate {
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
        .job-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
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
          
          <p>We're writing to inform you that your access to a job has been removed by <strong>${data.revokerName}</strong>.</p>
          
          <div class="job-card">
            <h3 style="margin: 0 0 10px 0;">${data.jobTitle}</h3>
            <p style="margin: 0; color: #666;">Previous Permission: ${data.permissionLevel.charAt(0).toUpperCase() + data.permissionLevel.slice(1)}</p>
          </div>
          
          <p>You no longer have access to this job's candidates, interviews, or related data. If you believe this was done in error, please contact your team administrator.</p>
          
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
Job Access Removed

Hi ${data.recipientName},

Your access to "${data.jobTitle}" has been removed by ${data.revokerName}.

Previous Permission Level: ${data.permissionLevel.charAt(0).toUpperCase() + data.permissionLevel.slice(1)}

You no longer have access to this job's data. If you believe this was done in error, please contact your team administrator.

Best regards,
The ${data.companyName} Team
  `;

  return { subject, html, text };
}
