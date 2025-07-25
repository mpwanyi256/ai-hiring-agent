import { createClient } from '@/lib/supabase/server';
import { EmailService, emailHelpers } from './emailService';
import { JobPermissionLevel } from '@/types/jobPermissions';

export interface PendingNotification {
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

export class NotificationProcessor {
  private static processingLock = false;

  /**
   * Process all pending email notifications
   */
  static async processAll(): Promise<void> {
    if (this.processingLock) {
      console.log('Notification processing already in progress...');
      return;
    }

    this.processingLock = true;
    try {
      await this.processPendingNotifications();
    } finally {
      this.processingLock = false;
    }
  }

  /**
   * Fetch and process pending notifications
   */
  private static async processPendingNotifications(): Promise<void> {
    const supabase = await createClient();

    // Get pending notifications
    const { data: notifications, error } = await supabase
      .from('pending_email_notifications')
      .select('*')
      .limit(50); // Process in batches

    if (error) {
      console.error('Failed to fetch pending notifications:', error);
      return;
    }

    if (!notifications || notifications.length === 0) {
      console.log('No pending notifications to process');
      return;
    }

    console.log(`Processing ${notifications.length} pending notifications...`);

    // Process each notification
    for (const notification of notifications) {
      try {
        await this.processNotification(notification);

        // Mark as processed by updating the metadata
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
              email_error: error instanceof Error ? error.message : 'Unknown error',
            },
          })
          .eq('id', notification.id);
      }
    }

    console.log('Finished processing notifications');
  }

  /**
   * Process a single notification
   */
  private static async processNotification(notification: PendingNotification): Promise<void> {
    const { event_type, meta } = notification;

    switch (event_type) {
      case 'job_permission_granted':
        await this.processJobPermissionGranted(notification);
        break;

      case 'job_permission_revoked':
        await this.processJobPermissionRevoked(notification);
        break;

      case 'team_invite_accepted':
        await this.processInviteAccepted(notification);
        break;

      case 'team_invite_rejected':
        await this.processInviteRejected(notification);
        break;

      default:
        console.warn(`Unknown event type for notification: ${event_type}`);
    }
  }

  /**
   * Process job permission granted notification
   */
  private static async processJobPermissionGranted(
    notification: PendingNotification,
  ): Promise<void> {
    const { meta } = notification;
    const supabase = await createClient();

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', notification.company_id)
      .single();

    const emailData = {
      recipientName: meta.user_name,
      granterName: meta.granted_by_name,
      jobTitle: meta.job_title,
      permissionLevel: meta.permission_level as JobPermissionLevel,
      companyName: emailHelpers.getCompanyName(company?.name),
      jobUrl: emailHelpers.getJobUrl(meta.job_id),
    };

    const result = await EmailService.sendJobPermissionGranted(meta.user_email, emailData);

    if (!result.success) {
      throw new Error(`Failed to send job permission granted email: ${result.error}`);
    }

    console.log(`Job permission granted email sent to ${meta.user_email}`);
  }

  /**
   * Process job permission revoked notification
   */
  private static async processJobPermissionRevoked(
    notification: PendingNotification,
  ): Promise<void> {
    const { meta } = notification;
    const supabase = await createClient();

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', notification.company_id)
      .single();

    const emailData = {
      recipientName: meta.user_name,
      revokerName: meta.revoked_by_name,
      jobTitle: meta.job_title,
      permissionLevel: meta.permission_level as JobPermissionLevel,
      companyName: emailHelpers.getCompanyName(company?.name),
    };

    const result = await EmailService.sendPermissionRevoked(meta.user_email, emailData);

    if (!result.success) {
      throw new Error(`Failed to send permission revoked email: ${result.error}`);
    }

    console.log(`Permission revoked email sent to ${meta.user_email}`);
  }

  /**
   * Process invite accepted notification
   */
  private static async processInviteAccepted(notification: PendingNotification): Promise<void> {
    const { meta } = notification;
    const supabase = await createClient();

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', notification.company_id)
      .single();

    const emailData = {
      inviterName: notification.user_name,
      inviteeName: meta.invitee_name,
      role: meta.role,
      companyName: emailHelpers.getCompanyName(company?.name),
      teamUrl: emailHelpers.getTeamUrl(),
    };

    const result = await EmailService.sendInviteAccepted(notification.user_email, emailData);

    if (!result.success) {
      throw new Error(`Failed to send invite accepted email: ${result.error}`);
    }

    console.log(`Invite accepted email sent to ${notification.user_email}`);
  }

  /**
   * Process invite rejected notification
   */
  private static async processInviteRejected(notification: PendingNotification): Promise<void> {
    const { meta } = notification;
    const supabase = await createClient();

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', notification.company_id)
      .single();

    const emailData = {
      inviterName: notification.user_name,
      inviteeName: meta.invitee_name,
      role: meta.role,
      companyName: emailHelpers.getCompanyName(company?.name),
    };

    const result = await EmailService.sendInviteRejected(notification.user_email, emailData);

    if (!result.success) {
      throw new Error(`Failed to send invite rejected email: ${result.error}`);
    }

    console.log(`Invite rejected email sent to ${notification.user_email}`);
  }
}

// Export a function that can be called by cron jobs or API routes
export async function processEmailNotifications(): Promise<void> {
  try {
    await NotificationProcessor.processAll();
  } catch (error) {
    console.error('Error in email notification processing:', error);
    throw error;
  }
}
