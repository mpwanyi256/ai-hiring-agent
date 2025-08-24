# Google Token Refresh System

This document describes the automated system for refreshing Google OAuth access tokens to prevent expiration issues.

## System Architecture

The system consists of several components working together:

1. **Database Migration**: Sets up cron jobs, views, and functions for token monitoring
2. **Edge Function**: Handles the actual token refresh logic in the background
3. **API Route**: Provides manual triggering and status monitoring
4. **Cron Job**: Automatically runs daily to check for expiring tokens

## Key Features

- **Provider-Agnostic Monitoring**: Views and functions work with all OAuth providers
- **Background Processing**: Token refresh runs asynchronously to prevent timeouts
- **Comprehensive Logging**: All operations are logged to `function_logs` table
- **Automatic Daily Execution**: Cron job runs at midnight UTC daily
- **Manual Triggering**: API endpoint for on-demand token refresh

## Database Schema

### Views

#### `provider_token_status`

Provider-agnostic view showing all OAuth token statuses:

- Token expiry information
- Status categorization (expired, expires_soon, valid, etc.)
- Hours until expiry
- Provider metadata

#### `google_token_status`

Google-specific view for backward compatibility:

- Same structure as `provider_token_status` but filtered for Google only
- Maintains existing API compatibility

### Functions

#### `refresh_google_tokens()`

Main function called by the cron job:

- Logs the start of the refresh process
- Identifies Google tokens expiring within 2 days
- Logs completion status

#### `get_expiring_tokens_summary()`

Provider-agnostic function returning:

- Total integrations count
- Expired/expiring token counts
- Breakdown by provider
- Last refresh attempt timestamp

#### `get_expiring_google_tokens_summary()`

Google-specific function for backward compatibility

#### `manual_refresh_google_tokens()`

Manual trigger function returning operation summary

### Cron Job

- **Name**: `refresh-google-tokens`
- **Schedule**: Daily at midnight UTC (`0 0 * * *`)
- **Function**: Calls `refresh_google_tokens()`

## Edge Function: `refresh-google-tokens`

### Background Processing

The Edge Function now operates as a background process using `EdgeRuntime.waitUntil()`:

1. **Immediate Response**: Returns HTTP 202 (Accepted) immediately
2. **Background Execution**: Token refresh continues in the background
3. **Timeout Prevention**: Eliminates function timeout issues
4. **Comprehensive Logging**: Tracks all stages of the process

### Function Flow

1. **Trigger**: HTTP request received and logged
2. **Background Start**: `performTokenRefreshInBackground()` called via `EdgeRuntime.waitUntil()`
3. **Token Discovery**: Fetches Google integrations expiring within 2 days
4. **Token Refresh**: Calls Google OAuth API for each expiring token
5. **Database Update**: Updates `integrations` table with new tokens
6. **Logging**: Comprehensive logging at each stage
7. **Summary**: Final summary logged with processing duration

### Environment Variables Required

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

## API Endpoints

### GET `/api/integrations/refresh-google-tokens`

Returns comprehensive token status information:

```json
{
  "success": true,
  "allProviders": {
    "status": [...], // All provider token statuses
    "summary": {...} // Provider-agnostic summary
  },
  "google": {
    "status": [...], // Google-specific token statuses
    "summary": {...} // Google-specific summary
  }
}
```

### POST `/api/integrations/refresh-google-tokens`

Manually triggers the token refresh process:

```json
{
  "success": true,
  "message": "Token refresh initiated"
}
```

## Monitoring and Logging

### Function Logs

All operations are logged to the `function_logs` table with the following function names:

- `refresh_google_tokens_trigger`: Initial function trigger
- `refresh_google_tokens_background`: Background processing stages
- `refresh_google_tokens`: Cron job execution

### Log Statuses

- `triggered`: Function execution started
- `processing`: Background processing in progress
- `success`: Operation completed successfully
- `partial_success`: Some tokens refreshed, some failed
- `error`: Operation failed

### Log Payloads

Logs include detailed information:

- Processing duration
- Token counts and results
- Error details
- Integration IDs and user information

## Deployment

### 1. Apply Migration

```bash
# Apply the migration to create views, functions, and cron job
supabase db push
```

### 2. Deploy Edge Function

```bash
# Deploy the refresh-google-tokens function
supabase functions deploy refresh-google-tokens
```

### 3. Set Environment Variables

```bash
# Set required environment variables
supabase secrets set GOOGLE_CLIENT_ID=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret
```

## Testing

### Manual Testing

1. **Check Token Status**:

   ```bash
   curl -X GET "https://your-project.supabase.co/functions/v1/refresh-google-tokens"
   ```

2. **Manual Refresh**:
   ```bash
   curl -X POST "https://your-project.supabase.co/functions/v1/refresh-google-tokens"
   ```

### Monitoring

1. **Check Function Logs**:

   ```sql
   SELECT * FROM function_logs
   WHERE function_name LIKE '%refresh_google_tokens%'
   ORDER BY created_at DESC;
   ```

2. **View Token Status**:
   ```sql
   SELECT * FROM provider_token_status;
   SELECT * FROM google_token_status;
   ```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**:
   - Ensure all required environment variables are set
   - Check Supabase secrets configuration

2. **Permission Errors**:
   - Verify service role key has necessary permissions
   - Check RLS policies on views and tables

3. **Google API Errors**:
   - Verify OAuth credentials are correct
   - Check if refresh tokens are still valid

4. **Background Processing Issues**:
   - Check function logs for detailed error information
   - Verify Edge Function deployment status

### Debug Steps

1. Check function logs in the `function_logs` table
2. Verify cron job status: `SELECT * FROM cron.job;`
3. Test Edge Function directly via Supabase dashboard
4. Check Google OAuth credentials and scopes

## Future Enhancements

- **Multi-Provider Support**: Extend to other OAuth providers
- **Retry Logic**: Implement exponential backoff for failed refreshes
- **Notification System**: Alert users when tokens fail to refresh
- **Metrics Dashboard**: Real-time monitoring of token health
- **Batch Processing**: Process multiple providers in parallel

## Security Considerations

- **Service Role Key**: Only used in Edge Function context
- **RLS Policies**: Views are protected by row-level security
- **Token Storage**: Access tokens are encrypted in transit
- **Audit Trail**: All operations are logged for compliance
