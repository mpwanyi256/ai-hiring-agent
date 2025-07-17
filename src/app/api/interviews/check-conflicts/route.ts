import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { candidateId, jobId, date, time, excludeInterviewId } = await request.json();

    if (!candidateId || !jobId || !date || !time) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 },
      );
    }

    // Convert date and time to a datetime for comparison
    const proposedDateTime = new Date(`${date}T${time}`);
    const proposedEndTime = new Date(proposedDateTime.getTime() + 30 * 60 * 1000); // 30 minutes duration

    // Check for conflicts using the interview_details view
    const { data: conflicts, error: conflictsError } = await supabase
      .from('interview_details')
      .select('*')
      .or(`application_id.eq.${candidateId},job_id.eq.${jobId}`)
      .neq('interview_id', excludeInterviewId || '')
      .neq('interview_status', 'cancelled')
      .eq('interview_date', date);

    if (conflictsError) {
      return NextResponse.json(
        {
          success: false,
          error: conflictsError.message,
        },
        { status: 500 },
      );
    }

    // Filter conflicts based on time overlap
    const timeConflicts = (conflicts || []).filter((conflict) => {
      const conflictDateTime = new Date(`${conflict.interview_date}T${conflict.interview_time}`);
      const conflictEndTime = new Date(
        conflictDateTime.getTime() + (conflict.duration || 30) * 60 * 1000,
      );

      // Check if there's any overlap
      return (
        (proposedDateTime >= conflictDateTime && proposedDateTime < conflictEndTime) ||
        (proposedEndTime > conflictDateTime && proposedEndTime <= conflictEndTime) ||
        (proposedDateTime <= conflictDateTime && proposedEndTime >= conflictEndTime)
      );
    });

    // Format conflicts for frontend
    const formattedConflicts = timeConflicts.map((conflict: any) => ({
      id: conflict.interview_id,
      candidate_name: conflict.candidate_name,
      job_title: conflict.job_title,
      date: conflict.interview_date,
      time: conflict.interview_time,
    }));

    return NextResponse.json({
      success: true,
      data: formattedConflicts,
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check conflicts',
      },
      { status: 500 },
    );
  }
}
