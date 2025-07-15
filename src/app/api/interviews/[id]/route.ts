import { NextRequest, NextResponse } from 'next/server';
import { UpdateInterviewData } from '@/types/interviews';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    const interviewId = params.id;
    const body: UpdateInterviewData = await request.json();

    // Fetch the interview and check ownership
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id, job_id, application_id')
      .eq('id', interviewId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
    }

    // Prepare update fields
    const updateFields: any = {};
    if (body.date) updateFields.date = body.date;
    if (body.time) updateFields.time = body.time;
    if (body.timezoneId) updateFields.timezone_id = body.timezoneId;
    if (body.duration) updateFields.duration = body.duration;
    if (body.notes !== undefined) updateFields.notes = body.notes;
    if (body.status) updateFields.status = body.status;
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

    return NextResponse.json({
      success: true,
      interview: updatedInterview,
    });
  } catch (error) {
    console.error('Error in interviews PUT:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
