import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidate_id, job_id } = body;

    if (!candidate_id || !job_id) {
      return NextResponse.json({ error: 'Candidate ID and Job ID are required' }, { status: 400 });
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

    // Check permissions
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions')
      .select('permission_level')
      .eq('job_id', job_id)
      .eq('user_id', user.id)
      .maybeSingle();

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

    // Get all unread messages for this candidate/job combination
    const { data: unreadMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .eq('candidate_id', candidate_id)
      .eq('job_id', job_id)
      .not('user_id', 'eq', user.id); // Don't include own messages

    if (messagesError) {
      console.error('Messages fetch error:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    if (!unreadMessages || unreadMessages.length === 0) {
      // No messages to mark as read
      return NextResponse.json({
        success: true,
        markedCount: 0,
        unreadCount: 0,
      });
    }

    const messageIds = unreadMessages.map((msg) => msg.id);

    // Use the database function to mark messages as read
    const { data: markedCount, error: markError } = await supabase.rpc('mark_messages_as_read', {
      p_message_ids: messageIds,
      p_user_id: user.id,
    });

    if (markError) {
      console.error('Mark as read error:', markError);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    // Get updated unread count
    const { data: unreadData, error: unreadError } = await supabase.rpc(
      'get_unread_message_count',
      {
        p_candidate_id: candidate_id,
        p_job_id: job_id,
        p_user_id: user.id,
      },
    );

    const unreadCount = !unreadError && unreadData !== null ? unreadData : 0;

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

// GET endpoint to retrieve read status and unread counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidate_id = searchParams.get('candidate_id');
    const job_id = searchParams.get('job_id');

    if (!candidate_id || !job_id) {
      return NextResponse.json({ error: 'Candidate ID and Job ID are required' }, { status: 400 });
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

    // Get unread count
    const { data: unreadData, error: unreadError } = await supabase.rpc(
      'get_unread_message_count',
      {
        p_candidate_id: candidate_id,
        p_job_id: job_id,
        p_user_id: user.id,
      },
    );

    if (unreadError) {
      console.error('Unread count error:', unreadError);
      return NextResponse.json({ error: 'Failed to get unread count' }, { status: 500 });
    }

    const unreadCount = unreadData || 0;

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('Error getting read status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
