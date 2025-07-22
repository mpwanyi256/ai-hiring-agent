import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { APIResponse } from '@/types';
import { AppRequestParams } from '@/types/api';
import { Event } from '@/types/interviews';

export async function GET(
  request: NextRequest,
  { params }: AppRequestParams<{ applicationId: string }>,
): Promise<NextResponse<APIResponse<Event[]>>> {
  try {
    const supabase = await createClient();
    const { applicationId } = await params;

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application ID is required',
          data: [],
        },
        { status: 400 },
      );
    }

    const { data: events, error: eventsError } = await supabase
      .from('interview_details')
      .select('*')
      .eq('application_id', applicationId);

    if (eventsError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch events',
          data: [],
        },
        { status: 500 },
      );
    }

    const formartedEvents = (events || []).map((event) => ({
      id: event.interview_id,
      applicationId: event.application_id,
      jobId: event.job_id,
      date: event.interview_date,
      time: event.interview_time,
      duration: event.duration,
      status: event.interview_status,
      notes: event.notes,
      meetingLink: event.meet_link,
      calendarEventId: event.calendar_event_id,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      candidateFirstName: event.candidate_first_name,
      candidateLastName: event.candidate_last_name,
      candidateEmail: event.candidate_email,
      jobTitle: event.job_title,
      jobOwnwerId: event.job_owner_id,
      companyName: event.company_name,
      companyId: event.company_id,
      eventSummary: event.event_summary,
      organizerInfo: event.organizer_info,
    })) as unknown as Event[];

    return NextResponse.json({
      data: formartedEvents,
      success: true,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch events',
        data: [],
      },
      { status: 500 },
    );
  }
}
