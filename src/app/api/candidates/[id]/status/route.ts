import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AppRequestParams } from '@/types/api';

export async function PATCH(request: NextRequest, { params }: AppRequestParams<{ id: string }>) {
  try {
    const supabase = await createClient();
    const { id: candidateId } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ success: false, error: 'Missing status' }, { status: 400 });
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get candidate details to find the current status
    const { data: candidateDetails, error: candidateError } = await supabase
      .from('candidates')
      .select('id, job_id, status')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidateDetails) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    // Update candidate status
    const { data: candidate, error } = await supabase
      .from('candidates')
      .update({ status })
      .eq('id', candidateId)
      .select()
      .single();

    if (error || !candidate) {
      console.log('Error updating candidate status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update candidate status' },
        { status: 500 },
      );
    }

    // Manually trigger notifications with actor exclusion
    // This bypasses the trigger and gives us control over who gets notified
    const { error: notificationError } = await supabase.rpc(
      'handle_candidate_status_notification',
      {
        p_candidate_id: candidateId,
        p_old_status: candidateDetails.status,
        p_new_status: status,
        p_exclude_user_id: user.id,
      },
    );

    if (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({ success: true, data: candidate });
  } catch (error) {
    console.error('Error updating candidate status:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
