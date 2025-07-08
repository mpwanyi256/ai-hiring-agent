import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      candidateId,
      date,
      time,
      duration,
      type,
      location,
      notes
    } = body;

    // Validate required fields
    if (!candidateId || !date || !time || !duration || !type) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get user profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
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

    // Verify candidate belongs to user's jobs
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(`
        id,
        job_id,
        jobs!inner(
          id,
          profile_id
        )
      `)
      .eq('id', candidateId)
      .eq('jobs.profile_id', profile.id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Candidate not found or access denied' 
      }, { status: 404 });
    }

    // Create interview schedule
    const { data: interview, error: interviewError } = await supabase
      .from('interview_schedules')
      .insert({
        candidate_id: candidateId,
        job_id: candidate.job_id,
        scheduled_date: `${date}T${time}:00`,
        duration_minutes: duration,
        interview_type: type,
        location: location || null,
        notes: notes || null,
        status: 'scheduled',
        created_by: profile.id
      })
      .select()
      .single();

    if (interviewError) {
      console.error('Error creating interview schedule:', interviewError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to schedule interview' 
      }, { status: 500 });
    }

    // Update candidate status
    const { error: updateError } = await supabase
      .from('candidates')
      .update({ status: 'interview_scheduled' })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Error updating candidate status:', updateError);
      // Don't fail the request if status update fails
    }

    // TODO: Send email notification to candidate
    // TODO: Create calendar event (Google Calendar integration)

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        scheduledDate: interview.scheduled_date,
        duration: interview.duration_minutes,
        type: interview.interview_type,
        status: interview.status
      }
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 