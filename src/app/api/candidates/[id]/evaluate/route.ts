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
    
    // Get current user profile for access control
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Verify user has access to this candidate through job ownership
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(`
        id,
        job_id,
        is_completed,
        jobs!inner(
          id,
          profile_id
        )
      `)
      .eq('id', candidateId)
      .eq('jobs.profile_id', user.id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Candidate not found or access denied' 
      }, { status: 404 });
    }

    if (!candidate.is_completed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Candidate interview not completed yet' 
      }, { status: 400 });
    }

    // Check if AI evaluation already exists
    const { data: existingEvaluation } = await supabase
      .from('ai_evaluations')
      .select('id')
      .eq('candidate_id', candidateId)
      .single();

    const { force } = await request.json().catch(() => ({ force: false }));

    if (existingEvaluation && !force) {
      return NextResponse.json({ 
        success: false, 
        error: 'AI evaluation already exists. Use force=true to regenerate.' 
      }, { status: 409 });
    }

    // If forcing regeneration, delete existing evaluation
    if (existingEvaluation && force) {
      await supabase
        .from('ai_evaluations')
        .delete()
        .eq('candidate_id', candidateId);
    }

    // Call the Edge Function with simplified parameters
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-candidate-evaluation`;
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        candidateId: candidateId
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to evaluate candidate');
    }

    return NextResponse.json({
      success: true,
      evaluation: result.evaluation,
      processingDurationMs: result.processingDurationMs
    });

  } catch (error) {
    console.error('Error triggering AI evaluation:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to trigger AI evaluation'
    }, { status: 500 });
  }
} 