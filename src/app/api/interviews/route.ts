import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CreateInterviewData, InterviewFilters } from '@/types/interviews';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const candidateId = searchParams.get('candidateId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('interviews')
      .select(
        `
        *,
        candidates!inner(
          id,
          firstName,
          lastName,
          email,
          jobId,
          jobTitle
        )
      `,
      )
      .eq('candidates.jobId', jobId); // Ensure user can only see interviews for their jobs

    // Apply filters
    if (candidateId) {
      query = query.eq('candidateId', candidateId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    // Get total count for pagination
    const { count } = await query;

    // Apply pagination
    const { data: interviews, error } = await query
      .range(offset, offset + limit - 1)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.error('Error fetching interviews:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch interviews' },
        { status: 500 },
      );
    }

    // Transform data to match expected format
    const transformedInterviews =
      interviews?.map((interview) => ({
        id: interview.id,
        applicationId: interview.applicationId,
        candidateId: interview.candidateId,
        jobId: interview.candidates.jobId,
        jobTitle: interview.candidates.jobTitle,
        candidateName: `${interview.candidates.firstName} ${interview.candidates.lastName}`,
        candidateEmail: interview.candidates.email,
        date: interview.date,
        time: interview.time,
        timezone: interview.timezone,
        duration: interview.duration,
        calendarEventId: interview.calendarEventId,
        meetLink: interview.meetLink,
        status: interview.status,
        notes: interview.notes,
        createdAt: interview.createdAt,
        updatedAt: interview.updatedAt,
      })) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      interviews: transformedInterviews,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error in interviews GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateInterviewData = await request.json();

    // Validate required fields
    if (
      !body.candidateId ||
      !body.jobId ||
      !body.date ||
      !body.time ||
      !body.timezone ||
      !body.duration
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Verify the candidate belongs to a job owned by the user
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id, jobId, firstName, lastName, email, jobTitle')
      .eq('id', body.candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    // Verify the job belongs to the user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, profileId')
      .eq('id', body.jobId)
      .single();

    if (jobError || !job || job.profileId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Job not found or access denied' },
        { status: 403 },
      );
    }

    // Check if interview already exists for this candidate and job
    const { data: existingInterview } = await supabase
      .from('interviews')
      .select('id')
      .eq('candidateId', body.candidateId)
      .eq('jobId', body.jobId)
      .eq('status', 'scheduled')
      .single();

    if (existingInterview) {
      return NextResponse.json(
        { success: false, error: 'Interview already scheduled for this candidate' },
        { status: 409 },
      );
    }

    // Create the interview
    const { data: interview, error: insertError } = await supabase
      .from('interviews')
      .insert({
        applicationId: body.candidateId, // Using candidateId as applicationId for now
        candidateId: body.candidateId,
        jobId: body.jobId,
        date: body.date,
        time: body.time,
        timezone: body.timezone,
        duration: body.duration,
        status: 'scheduled',
        notes: body.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating interview:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create interview' },
        { status: 500 },
      );
    }

    // Transform the response
    const transformedInterview = {
      id: interview.id,
      applicationId: interview.applicationId,
      candidateId: interview.candidateId,
      jobId: interview.jobId,
      jobTitle: candidate.jobTitle,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      candidateEmail: candidate.email,
      date: interview.date,
      time: interview.time,
      timezone: interview.timezone,
      duration: interview.duration,
      calendarEventId: interview.calendarEventId,
      meetLink: interview.meetLink,
      status: interview.status,
      notes: interview.notes,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    };

    return NextResponse.json({
      success: true,
      interview: transformedInterview,
    });
  } catch (error) {
    console.error('Error in interviews POST:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
