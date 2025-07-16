import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendInterviewReminderNotification } from '@/lib/services/emailService';
import { InterviewEmailData } from '@/types/integrations';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  // Find interviews starting within the next hour, not cancelled, not reminded
  const { data: interviews, error } = await supabase
    .from('interviews')
    .select(
      'id, application_id, job_id, date, time, timezone_id, duration, notes, status, reminder_sent_at, meet_link',
    )
    .is('reminder_sent_at', null)
    .in('status', ['scheduled', 'interview_scheduled', 'confirmed'])
    .gte('date', now.toISOString().slice(0, 10))
    .lte('date', oneHourLater.toISOString().slice(0, 10));

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let remindersSent = 0;
  for (const interview of interviews || []) {
    // Combine date and time to get interview start
    const interviewStart = new Date(`${interview.date}T${interview.time}`);
    if (interviewStart > now && interviewStart <= oneHourLater && !interview.reminder_sent_at) {
      // Fetch candidate and job info
      const { data: candidate } = await supabase
        .from('candidate_details')
        .select('first_name, last_name, email, job_title')
        .eq('id', interview.application_id)
        .single();
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', interview.job_id)
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
          meetLink: interview.meet_link || undefined,
          duration: interview.duration,
        };
        if (interview.notes) {
          emailData.notes = interview.notes;
        }
        const sent = await sendInterviewReminderNotification(emailData);
        if (sent) {
          await supabase
            .from('interviews')
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', interview.id);
          remindersSent++;
        }
      }
    }
  }

  return NextResponse.json({ success: true, remindersSent });
}
