import { NextRequest, NextResponse } from 'next/server';
import { UpdateInterviewData } from '@/types/interviews';
import { createClient } from '@/lib/supabase/server';
import { getValidGoogleAccessToken } from '@/lib/services/googleIntegrationService';
import { updateInterviewEvent } from '@/lib/services/googleCalendarService';
import { sendInterviewUpdateNotification } from '@/lib/services/emailService';
import { AppRequestParams } from '@/types/api';
import { InterviewEmailData } from '@/types/integrations';

export async function PUT(request: NextRequest, { params }: AppRequestParams<{ id: string }>) {
  try {
    const supabase = await createClient();

    const { id: interviewId } = await params;
    const body: UpdateInterviewData = await request.json();

    // Fetch the interview and check ownership
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(
        'id, job_id, application_id, calendar_event_id, date, time, timezone_id, duration, notes',
      )
      .eq('id', interviewId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
    }

    // Get current user from Supabase session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's company_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, company_id')
      .eq('id', user.id)
      .single();
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    // Google Calendar Integration: update event if integrated
    const calendarEventId = interview.calendar_event_id;
    let meetLink = null;
    const accessToken = await getValidGoogleAccessToken({
      userId: user.id,
      companyId: profile.company_id,
    });
    if (accessToken && calendarEventId) {
      try {
        // Fetch candidate and timezone info for event details
        const { data: candidate } = await supabase
          .from('candidate_details')
          .select('first_name, last_name, email, job_title')
          .eq('id', interview.application_id)
          .single();
        const { data: timezone } = await supabase
          .from('timezones')
          .select('name')
          .eq('id', body.timezoneId || interview.timezone_id)
          .single();
        if (!candidate || !timezone) {
          console.warn(
            'Missing candidate or timezone for Google Calendar update. Skipping event update.',
          );
        } else {
          const eventInput = {
            summary: `Interview with ${candidate.first_name} ${candidate.last_name} for ${candidate.job_title}`,
            description: 'Automated interview invite from AI Hiring Agent.',
            start: {
              dateTime: `${body.date || interview.date}T${body.time || interview.time}:00`,
              timeZone: timezone.name,
            },
            end: {
              dateTime: `${body.date || interview.date}T${body.time || interview.time}:00`,
              timeZone: timezone.name,
            },
            attendees: [{ email: candidate.email }],
          };
          const eventResult = await updateInterviewEvent({
            accessToken,
            eventId: calendarEventId,
            eventInput,
          });
          meetLink = eventResult.meetLink;
        }
      } catch (calendarError) {
        console.error('Google Calendar event update failed:', calendarError);
      }
    }

    // Prepare update fields
    const updateFields: {
      date?: string;
      time?: string;
      timezone_id?: string;
      duration?: number;
      notes?: string;
      status?: string;
      meet_link?: string | null;
      updated_at?: string;
    } = {};
    if (body.date) updateFields.date = body.date;
    if (body.time) updateFields.time = body.time;
    if (body.timezoneId) updateFields.timezone_id = body.timezoneId;
    if (body.duration) updateFields.duration = body.duration;
    if (body.notes !== undefined) updateFields.notes = body.notes;
    if (body.status) updateFields.status = body.status;
    if (meetLink) updateFields.meet_link = meetLink;
    updateFields.updated_at = new Date().toISOString();

    // Update the interview
    const { data: updatedInterview, error: updateError } = await supabase
      .from('interviews')
      .update(updateFields)
      .eq('id', interviewId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating interview:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update interview' },
        { status: 500 },
      );
    }

    // Send email notification for interview update
    try {
      // Fetch candidate and company info for email
      const { data: candidate } = await supabase
        .from('candidate_details')
        .select('first_name, last_name, email, job_title')
        .eq('id', interview.application_id)
        .single();

      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', profile.company_id)
        .single();

      const { data: timezone } = await supabase
        .from('timezones')
        .select('name')
        .eq('id', updatedInterview.timezone_id)
        .single();

      if (candidate && company && timezone) {
        const emailData: InterviewEmailData = {
          candidateName: `${candidate.first_name} ${candidate.last_name}`,
          candidateEmail: candidate.email,
          companyName: company.name,
          jobTitle: candidate.job_title,
          interviewDate: updatedInterview.date,
          interviewTime: updatedInterview.time,
          timezone: timezone.name,
          meetLink: updatedInterview.meet_link,
          duration: updatedInterview.duration,
        };

        if (updatedInterview.notes) {
          emailData.notes = updatedInterview.notes;
        }

        await sendInterviewUpdateNotification(emailData);
        console.log('Interview update email notification sent successfully.');
      }
    } catch (emailError) {
      console.error('Error sending interview update email notification:', emailError);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({
      success: true,
      interview: updatedInterview,
    });
  } catch (error) {
    console.error('Error in interviews PUT:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
