import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: candidateId } = await params;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!candidateId || !jobId) {
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

    // Check if user has permission to view this job's messages
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions')
      .select('permission_level')
      .eq('job_id', jobId)
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
      .eq('id', jobId)
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

    // Get messages using the database function
    const { data: messages, error: messagesError } = await supabase.rpc('get_candidate_messages', {
      p_candidate_id: candidateId,
      p_job_id: jobId,
      p_limit: limit,
      p_offset: offset,
    });

    if (messagesError) {
      console.error('Messages fetch error:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get unread count
    const { data: unreadCount, error: unreadError } = await supabase.rpc(
      'get_unread_message_count',
      {
        p_candidate_id: candidateId,
        p_job_id: jobId,
        p_user_id: user.id,
      },
    );

    if (unreadError) {
      console.error('Unread count error:', unreadError);
    }

    // Transform messages to match frontend interface
    const transformedMessages = (messages || []).map((message: any) => ({
      id: message.id,
      sender: {
        id: message.user_id,
        name: `${message.user_first_name || ''} ${message.user_last_name || ''}`.trim(),
        role: message.user_role || 'viewer',
        avatar: `${message.user_first_name?.charAt(0) || ''}${message.user_last_name?.charAt(0) || ''}`,
        isCurrentUser: message.user_id === user.id,
      },
      text: message.text,
      timestamp: message.created_at,
      status: message.status || 'sent',
      reactions: message.reactions || [],
      replyTo: message.reply_to_id
        ? {
            id: message.reply_to_id,
            text: message.reply_to_text || '',
            sender:
              `${message.reply_to_user_first_name || ''} ${message.reply_to_user_last_name || ''}`.trim(),
          }
        : undefined,
      editedAt: message.edited_at,
      attachment: message.attachment_url
        ? {
            url: message.attachment_url,
            name: message.attachment_name,
            size: message.attachment_size,
            type: message.attachment_type,
          }
        : undefined,
    }));

    return NextResponse.json({
      messages: transformedMessages,
      unreadCount: unreadCount || 0,
      hasMore: messages && messages.length === limit,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: candidateId } = await params;
    const body = await request.json();
    const { job_id, text, reply_to_id, attachment } = body;

    if (!candidateId || !job_id || !text?.trim()) {
      return NextResponse.json(
        { error: 'Candidate ID, Job ID, and message text are required' },
        { status: 400 },
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: 'Message text cannot exceed 2000 characters' },
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

    // Check if user has permission to send messages for this job
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
      return NextResponse.json(
        { error: 'Insufficient permissions to send messages' },
        { status: 403 },
      );
    }

    // Validate reply_to_id if provided
    let threadId = null;
    if (reply_to_id) {
      const { data: replyMessage, error: replyError } = await supabase
        .from('messages')
        .select('thread_id, id')
        .eq('id', reply_to_id)
        .eq('candidate_id', candidateId)
        .eq('job_id', job_id)
        .single();

      if (replyError || !replyMessage) {
        return NextResponse.json({ error: 'Invalid reply_to_id' }, { status: 400 });
      }

      // Set thread_id to the root of the thread or the message being replied to
      threadId = replyMessage.thread_id || replyMessage.id;
    }

    // Insert the message
    const messageData = {
      candidate_id: candidateId,
      job_id,
      user_id: user.id,
      text: text.trim(),
      reply_to_id: reply_to_id || null,
      thread_id: threadId,
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_size: attachment?.size || null,
      attachment_type: attachment?.type || null,
    };

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select(
        `
        *,
        profiles:user_id (
          first_name,
          last_name,
          role
        )
      `,
      )
      .single();

    if (messageError) {
      console.error('Message save error:', messageError);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    // Transform the response to match frontend interface
    const profile_data = Array.isArray(message.profiles) ? message.profiles[0] : message.profiles;
    const transformedMessage = {
      id: message.id,
      sender: {
        id: message.user_id,
        name: `${profile_data?.first_name || ''} ${profile_data?.last_name || ''}`.trim(),
        role: profile_data?.role || 'viewer',
        avatar: `${profile_data?.first_name?.charAt(0) || ''}${profile_data?.last_name?.charAt(0) || ''}`,
        isCurrentUser: true,
      },
      text: message.text,
      timestamp: message.created_at,
      status: message.status || 'sent',
      reactions: [],
      replyTo: reply_to_id
        ? {
            id: reply_to_id,
            text: 'Original message...',
            sender: 'User',
          }
        : undefined,
      editedAt: message.edited_at,
      attachment: message.attachment_url
        ? {
            url: message.attachment_url,
            name: message.attachment_name,
            size: message.attachment_size,
            type: message.attachment_type,
          }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      message: transformedMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
