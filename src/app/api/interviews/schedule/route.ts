import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateInterviewData } from '@/types/interviews';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body: CreateInterviewData = await request.json();

    // Validate required fields
    if (
      !body.applicationId ||
      !body.jobId ||
      !body.date ||
      !body.time ||
      !body.timezoneId ||
      !body.duration
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Validate date and time
    const selectedDateTime = new Date(`${body.date}T${body.time}`);
    const now = new Date();

    if (selectedDateTime <= now) {
      return NextResponse.json(
        { success: false, error: 'Interview must be scheduled for a future date and time' },
        { status: 400 },
      );
    }

    // Verify the candidate belongs to a job owned by the user
    const { data: candidate, error: candidateError } = await supabase
      .from('candidate_details')
      .select('id, job_id, first_name, last_name, email, job_title')
      .eq('id', body.applicationId)
      .maybeSingle();

    if (candidateError || !candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    // Verify the timezone exists with country information
    const { data: timezone, error: timezoneError } = await supabase
      .from('timezones')
      .select(
        `
        id,
        name,
        display_name,
        offset_hours,
        offset_minutes,
        is_dst,
        region,
        country_id,
        city,
        created_at,
        countries(
          id,
          name,
          code,
          continent,
          created_at
        )
      `,
      )
      .eq('id', body.timezoneId)
      .single();

    if (timezoneError || !timezone) {
      return NextResponse.json({ success: false, error: 'Invalid timezone' }, { status: 400 });
    }

    // Check if interview already exists for this candidate and job
    const { data: existingInterview } = await supabase
      .from('interviews')
      .select('id, status')
      .eq('application_id', body.applicationId)
      .eq('job_id', body.jobId)
      .in('status', ['interview_scheduled'])
      .single();

    if (existingInterview) {
      return NextResponse.json(
        { success: false, error: 'Interview already scheduled for this candidate' },
        { status: 409 },
      );
    }

    // TODO: Google Calendar Integration
    // This is where you would integrate with Google Calendar API
    // For now, we'll create the interview without calendar integration
    const calendarEventId = null;
    const meetLink = null;

    // Create the interview
    const { data: interview, error: insertError } = await supabase
      .from('interviews')
      .insert({
        application_id: body.applicationId,
        job_id: body.jobId,
        date: body.date,
        time: body.time,
        timezone_id: body.timezoneId,
        duration: body.duration,
        status: 'scheduled', // scheduled, confirmed, cancelled, completed, no_show, rescheduled
        notes: body.notes || null,
        calendar_event_id: calendarEventId,
        meet_link: meetLink,
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

    // TODO: Send email notification to candidate and employer
    // This is where you would integrate with your email service (Resend, SendGrid, etc.)

    // Transform the response
    const transformedInterview = {
      id: interview.id,
      applicationId: interview.application_id,
      jobId: interview.job_id,
      jobTitle: candidate.job_title,
      candidateName: `${candidate.first_name} ${candidate.last_name}`,
      candidateEmail: candidate.email,
      date: interview.date,
      time: interview.time,
      timezoneId: interview.timezone_id,
      timezone: {
        id: timezone.id,
        name: timezone.name,
        displayName: timezone.display_name,
        offsetHours: timezone.offset_hours,
        offsetMinutes: timezone.offset_minutes,
        isDst: timezone.is_dst || false,
        region: timezone.region,
        countryId: timezone.country_id,
        country:
          Array.isArray(timezone.countries) && timezone.countries.length > 0
            ? {
                id: timezone.countries[0].id,
                name: timezone.countries[0].name,
                code: timezone.countries[0].code,
                continent: timezone.countries[0].continent,
                createdAt: timezone.countries[0].created_at,
              }
            : null,
        city: timezone.city,
        createdAt: timezone.created_at,
      },
      duration: interview.duration,
      calendarEventId: interview.calendar_event_id,
      meetLink: interview.meet_link,
      status: interview.status,
      notes: interview.notes,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    };

    // update candidates table status to scheduled
    await supabase
      .from('candidates')
      .update({ status: 'interview_scheduled' })
      .eq('id', body.applicationId);

    return NextResponse.json({
      success: true,
      interview: transformedInterview,
      message: 'Interview scheduled successfully',
    });
  } catch (error) {
    console.error('Error in interviews schedule POST:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
