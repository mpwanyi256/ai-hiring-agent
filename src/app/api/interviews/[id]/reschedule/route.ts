import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id: interviewId } = await context.params;

  try {
    const { date, time, timezoneId, timezoneName, notes } = await request.json();

    if (!date || !time) {
      return NextResponse.json(
        {
          success: false,
          error: 'Date and time are required',
        },
        { status: 400 },
      );
    }

    // Fetch the interview and all related info from the interview_details view
    const { data: interview, error: fetchError } = await supabase
      .from('interview_details')
      .select('*')
      .eq('interview_id', interviewId)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json(
        {
          success: false,
          error: 'Interview not found',
        },
        { status: 404 },
      );
    }

    // Check for conflicts before proceeding
    const { data: conflicts, error: conflictError } = await supabase
      .from('interview_details')
      .select('*')
      .or(`application_id.eq.${interview.application_id},job_id.eq.${interview.job_id}`)
      .neq('interview_id', interviewId)
      .neq('interview_status', 'cancelled')
      .eq('interview_date', date);

    if (conflictError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check conflicts',
        },
        { status: 500 },
      );
    }

    // Filter conflicts based on time overlap
    const proposedDateTime = new Date(`${date}T${time}`);
    const proposedEndTime = new Date(
      proposedDateTime.getTime() + (interview.duration || 30) * 60 * 1000,
    );
    const timeConflicts = (conflicts || []).filter((conflict) => {
      const conflictDateTime = new Date(`${conflict.interview_date}T${conflict.interview_time}`);
      const conflictEndTime = new Date(
        conflictDateTime.getTime() + (conflict.duration || 30) * 60 * 1000,
      );
      return (
        (proposedDateTime >= conflictDateTime && proposedDateTime < conflictEndTime) ||
        (proposedEndTime > conflictDateTime && proposedEndTime <= conflictEndTime) ||
        (proposedDateTime <= conflictDateTime && proposedEndTime >= conflictEndTime)
      );
    });
    if (timeConflicts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'There is a scheduling conflict with another interview.',
        },
        { status: 409 },
      );
    }

    // Update the interview in the database
    const currentStatus = interview.interview_status;
    const newStatus = currentStatus === 'cancelled' ? 'scheduled' : currentStatus;

    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        date,
        time,
        timezone_id: timezoneId || interview.timezone_id,
        notes: notes || null,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', interviewId);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 },
      );
    }

    // Try to update Google Calendar event if it exists
    if (interview.calendar_event_id) {
      try {
        // Get user's Google integration
        const { data: integration, error: integrationError } = await supabase
          .from('integrations')
          .select('access_token, refresh_token')
          .eq('user_id', interview.job_owner_id)
          .eq('provider', 'google_calendar')
          .single();

        if (integration && !integrationError) {
          // Update Google Calendar event
          const googleCalendarService = await import('@/lib/services/googleCalendarService');
          const eventData = {
            summary: `Interview with ${interview.candidate_first_name} ${interview.candidate_last_name} for ${interview.job_title}`,
            description: `Interview for ${interview.job_title} position at ${interview.company_name}.
\n${notes || ''}`,
            start: {
              dateTime: new Date(`${date}T${time}`).toISOString(),
              timeZone: timezoneId || 'UTC',
            },
            end: {
              dateTime: new Date(
                new Date(`${date}T${time}`).getTime() + (interview.duration || 30) * 60 * 1000,
              ).toISOString(),
              timeZone: timezoneId || 'UTC',
            },
            attendees: [{ email: interview.candidate_email }],
          };

          const updatedEvent = await googleCalendarService.updateInterviewEvent({
            accessToken: integration.access_token,
            eventId: interview.calendar_event_id,
            eventInput: eventData,
          });

          if (updatedEvent.meetLink) {
            // Update the meet link in the database
            await supabase
              .from('interviews')
              .update({ meet_link: updatedEvent.meetLink })
              .eq('id', interviewId);
          }
        }
      } catch (googleError: any) {
        console.error('Google Calendar update error:', googleError);
        if (googleError.message?.includes('token') || googleError.message?.includes('expired')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Google Calendar token expired. Please reconnect your Google account.',
            },
            { status: 401 },
          );
        }
        // For other Google errors, continue but log the issue
        console.warn(
          'Google Calendar update failed, but interview was rescheduled:',
          googleError.message,
        );
      }
    }

    // Send email notification to candidate
    try {
      const emailService = await import('@/lib/services/emailService');
      await emailService.sendInterviewRescheduledEmail({
        candidateName: `${interview.candidate_first_name} ${interview.candidate_last_name}`,
        candidateEmail: interview.candidate_email,
        jobTitle: interview.job_title,
        companyName: interview.company_name,
        interviewDate: date,
        interviewTime: time,
        timezone: timezoneName || 'UTC',
        meetLink: interview.meet_link,
      });
    } catch (emailError) {
      console.error('Failed to send reschedule email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Interview rescheduled successfully',
    });
  } catch (error) {
    console.error('Reschedule error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reschedule interview',
      },
      { status: 500 },
    );
  }
}
