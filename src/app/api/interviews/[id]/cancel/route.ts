import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidGoogleAccessToken } from '@/lib/services/googleIntegrationService';
import { deleteInterviewEvent } from '@/lib/services/googleCalendarService';
import { sendInterviewCancellationNotification } from '@/lib/services/emailService';
import { AppRequestParams } from '@/types/api';
import { InterviewEmailData } from '@/types/integrations';

export async function PATCH(request: NextRequest, { params }: AppRequestParams<{ id: string }>) {
  try {
    const supabase = await createClient();
    const { id: interviewId } = await params;
    // Fetch interview
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(
        'id, job_id, application_id, calendar_event_id, date, time, timezone_id, duration, notes, status',
      )
      .eq('id', interviewId)
      .single();
    if (interviewError || !interview) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
    }
    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    // Get user's company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, company_id')
      .eq('id', user.id)
      .single();
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }
    // Remove Google Calendar event if integrated
    if (interview.calendar_event_id) {
      const accessToken = await getValidGoogleAccessToken({
        userId: user.id,
        companyId: profile.company_id,
      });
      if (accessToken) {
        try {
          await deleteInterviewEvent({ accessToken, eventId: interview.calendar_event_id });
        } catch (calendarError) {
          console.error('Failed to delete Google Calendar event:', calendarError);
        }
      }
    }
    // Update interview status to cancelled
    const { data: updatedInterview, error: updateError } = await supabase
      .from('interviews')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', interviewId)
      .select()
      .single();
    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel interview' },
        { status: 500 },
      );
    }
    // Send cancellation email
    try {
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
        .eq('id', interview.timezone_id)
        .single();
      if (candidate && company && timezone) {
        const emailData: InterviewEmailData = {
          candidateName: `${candidate.first_name} ${candidate.last_name}`,
          candidateEmail: candidate.email,
          companyName: company.name,
          jobTitle: candidate.job_title,
          interviewDate: interview.date,
          interviewTime: interview.time,
          timezone: timezone.name,
          meetLink: null,
          duration: interview.duration,
        };
        if (interview.notes) {
          emailData.notes = interview.notes;
        }
        await sendInterviewCancellationNotification(emailData);
      }
    } catch (emailError) {
      console.error('Error sending interview cancellation email:', emailError);
    }
    return NextResponse.json({ success: true, interview: updatedInterview });
  } catch (error) {
    console.error('Error in interviews PATCH /cancel:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
