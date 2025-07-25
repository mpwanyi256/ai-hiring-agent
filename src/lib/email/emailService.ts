import { Resend } from 'resend';
import {
  EmailTemplate,
  JobPermissionGrantedTemplateData,
  InviteAcceptedTemplateData,
  InviteRejectedTemplateData,
  PermissionRevokedTemplateData,
  generateJobPermissionGrantedEmail,
  generateInviteAcceptedEmail,
  generateInviteRejectedEmail,
  generatePermissionRevokedEmail,
} from './templates';
import { integrations, domainEmails } from '../constants';

// Lazy-load Resend client to avoid build-time errors
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = integrations.resend.apiKey;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static readonly FROM_EMAIL = domainEmails.noReply;
  private static readonly DEFAULT_REPLY_TO = domainEmails.noReply;

  /**
   * Send a generic email using a template
   */
  private static async sendEmail(
    to: string,
    template: EmailTemplate,
    replyTo?: string,
  ): Promise<EmailSendResult> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not found. Email would be sent in production.');
        return { success: true, messageId: 'dev-mode' };
      }

      const result = await getResendClient().emails.send({
        from: this.FROM_EMAIL,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: replyTo || this.DEFAULT_REPLY_TO,
      });

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send job permission granted notification
   */
  static async sendJobPermissionGranted(
    recipientEmail: string,
    data: JobPermissionGrantedTemplateData,
  ): Promise<EmailSendResult> {
    const template = generateJobPermissionGrantedEmail(data);
    return this.sendEmail(recipientEmail, template);
  }

  /**
   * Send invite accepted notification to inviter
   */
  static async sendInviteAccepted(
    inviterEmail: string,
    data: InviteAcceptedTemplateData,
  ): Promise<EmailSendResult> {
    const template = generateInviteAcceptedEmail(data);
    return this.sendEmail(inviterEmail, template);
  }

  /**
   * Send invite rejected notification to inviter
   */
  static async sendInviteRejected(
    inviterEmail: string,
    data: InviteRejectedTemplateData,
  ): Promise<EmailSendResult> {
    const template = generateInviteRejectedEmail(data);
    return this.sendEmail(inviterEmail, template);
  }

  /**
   * Send permission revoked notification
   */
  static async sendPermissionRevoked(
    recipientEmail: string,
    data: PermissionRevokedTemplateData,
  ): Promise<EmailSendResult> {
    const template = generatePermissionRevokedEmail(data);
    return this.sendEmail(recipientEmail, template);
  }

  /**
   * Send bulk notifications (useful for team-wide announcements)
   */
  static async sendBulkEmails(
    recipients: { email: string; data: any }[],
    templateGenerator: (data: any) => EmailTemplate,
  ): Promise<EmailSendResult[]> {
    const results = await Promise.allSettled(
      recipients.map(({ email, data }) => {
        const template = templateGenerator(data);
        return this.sendEmail(email, template);
      }),
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Failed to send email',
        };
      }
    });
  }
}

// Helper functions for common use cases
export const emailHelpers = {
  /**
   * Get job URL for email templates
   */
  getJobUrl: (
    jobId: string,
    baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ) => {
    return `${baseUrl}/dashboard/jobs/${jobId}`;
  },

  /**
   * Get team URL for email templates
   */
  getTeamUrl: (baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') => {
    return `${baseUrl}/dashboard/teams`;
  },

  /**
   * Format user name for email templates
   */
  formatUserName: (firstName: string, lastName?: string) => {
    return `${firstName}${lastName ? ` ${lastName}` : ''}`;
  },

  /**
   * Get company name from profile or fallback
   */
  getCompanyName: (companyName?: string) => {
    return companyName || 'Your Company';
  },
};
