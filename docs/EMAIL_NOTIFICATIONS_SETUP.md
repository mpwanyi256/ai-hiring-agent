# Email Notifications Setup Guide

This guide will help you set up the complete email notification system using Supabase Edge Functions and database cron jobs.

## Overview

The email notification system consists of:

- **Database triggers** that queue notifications when team events occur
- **Supabase Edge Function** that processes notifications and sends emails via Resend
- **Database cron jobs** that automatically trigger email processing every 5 minutes
- **Manual triggers** for immediate processing and debugging

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Supabase Project**: Ensure you have a Supabase project
3. **Domain Verification**: Verify your domain in Resend for production emails

## Step 1: Configure Environment Variables

### Supabase Edge Function Environment Variables

In your Supabase Dashboard → Project Settings → Edge Functions → Environment variables, add:

```
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_FROM=noreply@yourdomain.com
APP_URL=https://yourdomain.com
```

### Local Development (optional)

Create `supabase/functions/send-team-notifications/.env`:

```
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_FROM=noreply@yourdomain.com
APP_URL=http://localhost:3000
```

## Step 2: Deploy the Edge Function

The function is already deployed, but to redeploy if needed:

```bash
supabase functions deploy send-team-notifications
```

## Step 3: Configure Database Settings

Run this in your Supabase SQL Editor with your actual values:

```sql
-- Configure the notification system with your Supabase settings
SELECT setup_email_notifications_config(
    'https://msrspatwjkmyhgqucxuh.supabase.co',  -- Your Supabase URL
    'your-service-role-key-here'                 -- Your service role key
);
```

**Important**: Replace with your actual Supabase URL and service role key from Project Settings → API.

## Step 4: Enable pg_cron Extension (Optional but Recommended)

For automatic processing, enable the `pg_cron` extension in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

## Step 5: Set Up Automatic Cron Job

Create a cron job to run every 5 minutes:

```sql
SELECT cron.schedule(
    'process-email-notifications',
    '*/5 * * * *',
    'SELECT trigger_email_notifications_http();'
);
```

Verify the cron job was created:

```sql
SELECT * FROM cron.job;
```

## Step 6: Test the System

### Manual Test

Trigger email processing manually:

```sql
SELECT manual_trigger_email_notifications();
```

### Check System Status

```sql
SELECT get_email_notification_status();
```

### Monitor Activity

```sql
SELECT * FROM email_cron_activity ORDER BY created_at DESC LIMIT 10;
```

## Step 7: Verify Email Configuration

### Test Email Sending

1. Grant a job permission to a team member
2. Check the `pending_email_notifications` view:
   ```sql
   SELECT * FROM pending_email_notifications;
   ```
3. Manually trigger processing:
   ```sql
   SELECT manual_trigger_email_notifications();
   ```
4. Check if the notification was processed:
   ```sql
   SELECT * FROM user_activities
   WHERE event_type LIKE 'email_%'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## Email Templates

The system includes professional email templates for:

1. **Job Permission Granted** - Notifies users when they gain job access
2. **Job Permission Revoked** - Notifies users when access is removed
3. **Invite Accepted** - Notifies inviters when invitations are accepted
4. **Invite Rejected** - Notifies inviters when invitations are declined

## Monitoring & Debugging

### Check Notification Queue

```sql
SELECT COUNT(*) as pending_count FROM pending_email_notifications;
```

### View Recent Email Activity

```sql
SELECT
    event_type,
    message,
    meta,
    created_at
FROM user_activities
WHERE event_type LIKE 'email_%'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Cron Job Status

```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Manual Processing (for Admins)

Use the UI in Settings → Notifications or call the function directly:

```sql
SELECT manual_trigger_email_notifications();
```

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check Resend API key is correct
   - Verify domain is configured in Resend
   - Check Edge Function logs in Supabase Dashboard

2. **Cron job not running**
   - Ensure pg_cron extension is enabled
   - Check cron job exists: `SELECT * FROM cron.job;`
   - Check cron job logs: `SELECT * FROM cron.job_run_details;`

3. **Notifications not queued**
   - Check database triggers are working
   - Verify team events are creating user activities
   - Check if `should_send_email` flag is set in metadata

### Function Logs

Check Edge Function logs in Supabase Dashboard → Edge Functions → send-team-notifications → Logs

### Database Logs

Check database logs for trigger execution and cron job runs.

## Production Considerations

### Security

- Use environment variables for sensitive data
- Ensure service role key is kept secure
- Consider IP restrictions if needed

### Reliability

- Monitor cron job execution
- Set up alerts for failed email sends
- Consider backup notification methods

### Performance

- Current batch size is 50 notifications per run
- Cron job runs every 5 minutes
- Adjust frequency if needed based on volume

### Cost Management

- Monitor Resend usage and costs
- Consider rate limiting for high-volume scenarios
- Implement email preferences for users

## Support

For issues with:

- **Supabase Edge Functions**: Check Supabase documentation
- **Resend API**: Check Resend documentation
- **pg_cron**: Check PostgreSQL cron extension docs

## Next Steps

Consider implementing:

1. Email preferences for users
2. Bulk notification processing for high volume
3. Email templates customization per company
4. Webhook notifications as backup
5. Real-time notifications via WebSocket for immediate alerts
