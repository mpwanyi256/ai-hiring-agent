import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: candidateId } = await params;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');

    if (!candidateId || !jobId) {
      return NextResponse.json({ error: 'Candidate ID and Job ID are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view this job's candidates
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions')
      .select('permission_level')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (permissionError) {
      console.error('Permission check error:', permissionError);
      return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 });
    }

    // User must have at least viewer permissions to see responses
    if (!permission && !(await isJobOwnerOrAdmin(user.id, jobId))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if current user has submitted a response
    const { data: userResponse, error: userResponseError } = await supabase
      .from('team_responses')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (userResponseError) {
      console.error('User response check error:', userResponseError);
      return NextResponse.json({ error: 'Failed to check user response' }, { status: 500 });
    }

    // Only show other responses if user has submitted their own (unless viewer+ role)
    const showAllResponses =
      userResponse !== null ||
      ['interviewer', 'manager', 'admin'].includes(permission?.permission_level || '');

    if (!showAllResponses) {
      return NextResponse.json({
        responses: [],
        summary: null,
        userResponse: userResponse,
        canViewResponses: false,
        message: 'Submit your response to view team responses',
      });
    }

    // Fetch all team responses
    const { data: responses, error: responsesError } = await supabase
      .from('team_responses_detailed')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (responsesError) {
      console.error('Responses fetch error:', responsesError);
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }

    // Get response summary
    const { data: summary, error: summaryError } = await supabase.rpc('get_team_response_summary', {
      p_candidate_id: candidateId,
      p_job_id: jobId,
    });

    if (summaryError) {
      console.error('Summary fetch error:', summaryError);
    }

    return NextResponse.json({
      responses: responses || [],
      summary: summary?.[0] || null,
      userResponse,
      canViewResponses: true,
    });
  } catch (error) {
    console.error('Error fetching team responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: candidateId } = await params;
    const body = await request.json();
    const {
      job_id,
      vote,
      comment,
      confidence_level,
      technical_skills,
      communication_skills,
      cultural_fit,
    } = body;

    if (!candidateId || !job_id || !vote) {
      return NextResponse.json(
        { error: 'Candidate ID, Job ID, and vote are required' },
        { status: 400 },
      );
    }

    if (!['positive', 'negative', 'neutral'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to respond (at least interviewer level)
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions')
      .select('permission_level')
      .eq('job_id', job_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (permissionError) {
      console.error('Permission check error:', permissionError);
      return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 });
    }

    const hasInterviewerAccess =
      permission && ['interviewer', 'manager', 'admin'].includes(permission.permission_level);
    const isOwnerOrAdmin = await isJobOwnerOrAdmin(user.id, job_id);

    if (!hasInterviewerAccess && !isOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'You need interviewer permissions or higher to submit responses' },
        { status: 403 },
      );
    }

    // Insert or update team response
    const { data: response, error: responseError } = await supabase
      .from('team_responses')
      .upsert(
        {
          candidate_id: candidateId,
          job_id,
          user_id: user.id,
          vote,
          comment: comment || null,
          confidence_level: confidence_level || 5,
          technical_skills: technical_skills || null,
          communication_skills: communication_skills || null,
          cultural_fit: cultural_fit || null,
        },
        {
          onConflict: 'candidate_id,job_id,user_id',
        },
      )
      .select()
      .single();

    if (responseError) {
      console.error('Response save error:', responseError);
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
    }

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('Error saving team response:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to check if user is job owner or admin
async function isJobOwnerOrAdmin(userId: string, jobId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('profile_id')
    .eq('id', jobId)
    .single();

  if (jobError || !job) return false;

  if (job.profile_id === userId) return true;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return !profileError && profile?.role === 'admin';
}
