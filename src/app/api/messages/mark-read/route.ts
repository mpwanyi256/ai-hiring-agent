import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_ids, candidate_id, job_id } = body;

    if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
      return NextResponse.json({ error: 'Message IDs array is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If candidate_id and job_id are provided, verify permissions
    if (candidate_id && job_id) {
      // Check if user has permission to view this job's messages
      const { data: permission, error: permissionError } = await supabase
        .from('job_permissions')
        .select('permission_level')
        .eq('job_id', job_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (permissionError) {
        console.error('Permission check error:', permissionError);
        return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 });
      }

      // Check if user is job owner or admin
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('profile_id')
        .eq('id', job_id)
        .single();

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isJobOwner = job && job.profile_id === user.id;
      const isAdmin = profile && profile.role === 'admin';

      if (!permission && !isJobOwner && !isAdmin) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    // Verify that all message IDs belong to messages the user can access
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, candidate_id, job_id')
      .in('id', message_ids);

    if (messagesError) {
      console.error('Messages fetch error:', messagesError);
      return NextResponse.json({ error: 'Failed to verify messages' }, { status: 500 });
    }

    if (!messages || messages.length !== message_ids.length) {
      return NextResponse.json({ error: 'Some message IDs are invalid' }, { status: 400 });
    }

    // Use the database function to mark messages as read
    const { data: markedCount, error: markError } = await supabase.rpc('mark_messages_as_read', {
      p_message_ids: message_ids,
      p_user_id: user.id,
    });

    if (markError) {
      console.error('Mark as read error:', markError);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    // If candidate_id and job_id provided, get updated unread count
    let unreadCount = 0;
    if (candidate_id && job_id) {
      const { data: unreadData, error: unreadError } = await supabase.rpc(
        'get_unread_message_count',
        {
          p_candidate_id: candidate_id,
          p_job_id: job_id,
          p_user_id: user.id,
        },
      );

      if (!unreadError && unreadData !== null) {
        unreadCount = unreadData;
      }
    }

    return NextResponse.json({
      success: true,
      markedCount: markedCount || 0,
      unreadCount,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to check read status of specific messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageIds = searchParams.get('message_ids')?.split(',') || [];
    const candidateId = searchParams.get('candidate_id');
    const jobId = searchParams.get('job_id');

    if (messageIds.length === 0 && !candidateId && !jobId) {
      return NextResponse.json(
        { error: 'Message IDs or candidate_id/job_id are required' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let readStatus: any[] = [];
    let unreadCount = 0;

    // Get read status for specific messages
    if (messageIds.length > 0) {
      const { data: statusData, error: statusError } = await supabase
        .from('message_read_status')
        .select('message_id, read_at')
        .in('message_id', messageIds)
        .eq('user_id', user.id);

      if (statusError) {
        console.error('Read status fetch error:', statusError);
        return NextResponse.json({ error: 'Failed to fetch read status' }, { status: 500 });
      }

      readStatus = statusData || [];
    }

    // Get unread count for candidate/job combination
    if (candidateId && jobId) {
      const { data: unreadData, error: unreadError } = await supabase.rpc(
        'get_unread_message_count',
        {
          p_candidate_id: candidateId,
          p_job_id: jobId,
          p_user_id: user.id,
        },
      );

      if (!unreadError && unreadData !== null) {
        unreadCount = unreadData;
      }
    }

    return NextResponse.json({
      success: true,
      readStatus,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching read status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
