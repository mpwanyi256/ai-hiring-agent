import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Type declaration for EdgeRuntime (Supabase Edge Functions)
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

interface GoogleTokenRefreshResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface GoogleIntegration {
  id: string;
  user_id: string;
  company_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  metadata: {
    email?: string;
    name?: string;
    google_id?: string;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Background task function that performs the actual token refresh
async function performTokenRefreshInBackground() {
  const startTime = Date.now();

  try {
    console.log('Starting background Google token refresh process');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!googleClientId || !googleClientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Log the start of background processing
    await supabase.from('function_logs').insert({
      function_name: 'refresh_google_tokens_background',
      status: 'processing',
      message: 'Background Google token refresh process started',
      payload: { start_time: new Date(startTime).toISOString() },
    });

    const { data: expiringIntegrations, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('provider', 'google')
      .not('refresh_token', 'is', null)
      .lte('expires_at', new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()) // Expiring within 2 days
      .gt('expires_at', new Date().toISOString()); // Not already expired

    if (fetchError) {
      throw new Error(`Failed to fetch expiring integrations: ${fetchError.message}`);
    }

    if (!expiringIntegrations || expiringIntegrations.length === 0) {
      console.log('No Google integrations need token refresh');

      await supabase.from('function_logs').insert({
        function_name: 'refresh_google_tokens_background',
        status: 'success',
        message: 'No Google tokens need refresh',
        payload: {
          total_processed: 0,
          success_count: 0,
          error_count: 0,
          processing_duration_ms: Date.now() - startTime,
        },
      });

      return;
    }

    console.log(`Found ${expiringIntegrations.length} Google integrations that need token refresh`);

    const refreshResults = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each integration
    for (const integration of expiringIntegrations as GoogleIntegration[]) {
      try {
        console.log(
          `Refreshing token for user ${integration.user_id}, expires at: ${integration.expires_at}`,
        );

        // Refresh the token with Google
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          throw new Error(`Google token refresh failed: ${tokenResponse.status} - ${errorText}`);
        }

        const tokenData: GoogleTokenRefreshResponse = await tokenResponse.json();

        // Calculate new expiry time
        const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

        // Update the integration in the database
        const { error: updateError } = await supabase
          .from('integrations')
          .update({
            access_token: tokenData.access_token,
            expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id);

        if (updateError) {
          throw new Error(`Failed to update integration: ${updateError.message}`);
        }

        // Log success
        await supabase.from('function_logs').insert({
          function_name: 'refresh_google_tokens_background',
          payload: {
            integration_id: integration.id,
            user_id: integration.user_id,
            old_expires_at: integration.expires_at,
            new_expires_at: newExpiresAt.toISOString(),
          },
          status: 'success',
          message: `Successfully refreshed token for user ${integration.user_id}`,
        });

        refreshResults.push({
          integration_id: integration.id,
          user_id: integration.user_id,
          status: 'success',
          old_expires_at: integration.expires_at,
          new_expires_at: newExpiresAt.toISOString(),
        });

        successCount++;
        console.log(`Successfully refreshed token for user ${integration.user_id}`);
      } catch (error) {
        console.error(`Failed to refresh token for user ${integration.user_id}:`, error);

        // Log error
        await supabase.from('function_logs').insert({
          function_name: 'refresh_google_tokens_background',
          payload: {
            integration_id: integration.id,
            user_id: integration.user_id,
          },
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          message: `Failed to refresh token for user ${integration.user_id}`,
        });

        refreshResults.push({
          integration_id: integration.id,
          user_id: integration.user_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        errorCount++;
      }
    }

    const processingDuration = Date.now() - startTime;

    // Log summary
    await supabase.from('function_logs').insert({
      function_name: 'refresh_google_tokens_background',
      payload: {
        total_processed: expiringIntegrations.length,
        success_count: successCount,
        error_count: errorCount,
        processing_duration_ms: processingDuration,
        results: refreshResults,
      },
      status: errorCount === 0 ? 'success' : 'partial_success',
      message: `Background processing completed: ${expiringIntegrations.length} tokens processed, ${successCount} successful, ${errorCount} failed in ${processingDuration}ms`,
    });

    console.log(
      `Background token refresh completed: ${successCount} successful, ${errorCount} failed in ${processingDuration}ms`,
    );
  } catch (error) {
    console.error('Background Google token refresh error:', error);

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      await supabase.from('function_logs').insert({
        function_name: 'refresh_google_tokens_background',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        message: 'Background Google token refresh process failed',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          processing_duration_ms: Date.now() - startTime,
        },
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for initial logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Log the trigger
    await supabase.from('function_logs').insert({
      function_name: 'refresh_google_tokens_trigger',
      status: 'triggered',
      message: 'Google token refresh request received, starting background processing',
      payload: {
        trigger_time: new Date().toISOString(),
        method: req.method,
        url: req.url,
      },
    });

    // Trigger background token refresh
    EdgeRuntime.waitUntil(performTokenRefreshInBackground());

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Google token refresh started in background',
        status: 'processing',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202, // Accepted - processing started
      },
    );
  } catch (error) {
    console.error('Edge Function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
