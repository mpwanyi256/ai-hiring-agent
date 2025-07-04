import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Await params before accessing properties (Next.js 15 requirement)
    const resolvedParams = await params;
    const candidateId = resolvedParams.id;
    
    // Get current user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found' 
      }, { status: 404 });
    }

    const profileId = profile.id;
    
    // Get request body for options
    const body = await request.json().catch(() => ({}));
    const { force = false } = body;

    // Use the manual trigger function to validate and get parameters
    const { data: triggerResult, error: triggerError } = await supabase
      .rpc('manual_trigger_ai_evaluation', {
        p_candidate_id: candidateId,
        p_force: force
      });

    if (triggerError) {
      console.error('Trigger validation error:', triggerError);
      return NextResponse.json({ 
        success: false, 
        error: triggerError.message 
      }, { status: 400 });
    }

    if (!triggerResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: triggerResult.error 
      }, { status: 400 });
    }

    // Verify user owns this job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, profile_id')
      .eq('id', triggerResult.jobId)
      .eq('profile_id', profileId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job not found or access denied' 
      }, { status: 403 });
    }

    // Call the AI evaluation Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error' 
      }, { status: 500 });
    }

    const functionUrl = `${supabaseUrl}/functions/v1/ai-candidate-evaluation`;
    
    const functionPayload = {
      candidateId: triggerResult.candidateId,
      jobId: triggerResult.jobId,
      profileId: triggerResult.profileId
    };

    // Call the Edge Function
    console.log('Calling AI evaluation Edge Function for candidate:', candidateId);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(functionPayload)
    });

    const functionResult = await response.json();

    if (!response.ok) {
      console.error('Edge Function error:', functionResult);
      
      // Update function log with error
      await supabase
        .from('function_logs')
        .update({
          status: 'failed',
          error_message: functionResult.error || 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('candidate_id', candidateId)
        .eq('function_name', 'ai-candidate-evaluation-manual')
        .order('triggered_at', { ascending: false })
        .limit(1);

      return NextResponse.json({ 
        success: false, 
        error: functionResult.error || 'AI evaluation failed' 
      }, { status: 500 });
    }

    // Update function log with success
    await supabase
      .from('function_logs')
      .update({
        status: 'success',
        completed_at: new Date().toISOString()
      })
      .eq('candidate_id', candidateId)
      .eq('function_name', 'ai-candidate-evaluation-manual')
      .order('triggered_at', { ascending: false })
      .limit(1);

    console.log('AI evaluation completed successfully for candidate:', candidateId);

    return NextResponse.json({
      success: true,
      message: 'AI evaluation completed successfully',
      evaluation: functionResult.evaluation,
      processingDurationMs: functionResult.processingDurationMs
    });

  } catch (error) {
    console.error('Error triggering AI evaluation:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to trigger AI evaluation'
    }, { status: 500 });
  }
} 