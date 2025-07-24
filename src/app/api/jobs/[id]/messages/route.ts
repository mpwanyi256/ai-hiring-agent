import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
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
    const { data: permission } = await supabase
      .from('job_permissions')
      .select('permission_level')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .maybeSingle();

    // Check if user is job owner
    const { data: job } = await supabase.from('jobs').select('profile_id').eq('id', jobId).single();

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isJobOwner = job && job.profile_id === user.id;
    const isAdmin = profile && profile.role === 'admin';

    if (!permission && !isJobOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get messages using the new function
    const { data: messages, error: messagesError } = await supabase.rpc('get_job_messages', {
      p_job_id: jobId,
      p_limit: limit,
      p_offset: offset,
    });

    if (messagesError) {
      console.error('Messages fetch error:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Transform messages to match frontend interface
    const transformedMessages = (messages || []).map((msg: any) => ({
      id: msg.id,
      text: msg.text,
      sender: {
        id: msg.user_id,
        name: `${msg.user_first_name || ''} ${msg.user_last_name || ''}`.trim(),
        email: msg.user_email || '',
        role: msg.user_role || 'viewer',
        isCurrentUser: msg.user_id === user.id,
      },
      timestamp: msg.created_at,
      reactions: [], // Will be populated by separate query
      replyTo: msg.reply_to_id
        ? {
            id: msg.reply_to_id,
            text: msg.reply_to_text || '',
            sender: {
              name: `${msg.reply_to_user_first_name || ''} ${msg.reply_to_user_last_name || ''}`.trim(),
            },
          }
        : undefined,
      attachment: msg.attachment_url
        ? {
            url: msg.attachment_url,
            name: msg.attachment_name || '',
            size: msg.attachment_size || 0,
            type: msg.attachment_type || '',
          }
        : undefined,
      isEdited: !!msg.edited_at,
      editedAt: msg.edited_at,
    }));

    // Get reactions for all messages
    if (transformedMessages.length > 0) {
      const messageIds = transformedMessages.map((m: any) => m.id);
      const { data: reactions } = await supabase
        .from('message_reactions')
        .select(
          `
          message_id,
          emoji,
          user_id,
          profiles:user_id (
            first_name,
            last_name
          )
        `,
        )
        .in('message_id', messageIds);

      // Group reactions by message
      const reactionsByMessage = (reactions || []).reduce((acc: any, reaction: any) => {
        if (!acc[reaction.message_id]) {
          acc[reaction.message_id] = {};
        }
        if (!acc[reaction.message_id][reaction.emoji]) {
          acc[reaction.message_id][reaction.emoji] = {
            id: reaction.emoji,
            emoji: reaction.emoji,
            count: 0,
            users: [],
            hasReacted: false,
          };
        }
        acc[reaction.message_id][reaction.emoji].count++;

        const profile = Array.isArray(reaction.profiles) ? reaction.profiles[0] : reaction.profiles;
        if (profile) {
          const userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          acc[reaction.message_id][reaction.emoji].users.push(userName);
        }

        if (reaction.user_id === user.id) {
          acc[reaction.message_id][reaction.emoji].hasReacted = true;
        }

        return acc;
      }, {});

      // Add reactions to messages
      transformedMessages.forEach((message: any) => {
        if (reactionsByMessage[message.id]) {
          message.reactions = Object.values(reactionsByMessage[message.id]);
        }
      });
    }

    // Get unread count
    const { data: unreadData } = await supabase.rpc('get_unread_message_count', {
      p_job_id: jobId,
      p_user_id: user.id,
    });

    const unreadCount = unreadData || 0;

    // Check if there are more messages
    const hasMore = transformedMessages.length === limit;

    return NextResponse.json({
      success: true,
      messages: transformedMessages,
      hasMore,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();
    const { text, reply_to_id, attachment_url, attachment_name, attachment_size, attachment_type } =
      body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
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

    // Check permissions (same as GET)
    const { data: permission } = await supabase
      .from('job_permissions')
      .select('permission_level')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: job } = await supabase.from('jobs').select('profile_id').eq('id', jobId).single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isJobOwner = job && job.profile_id === user.id;
    const isAdmin = profile && profile.role === 'admin';

    if (!permission && !isJobOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Create the message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        text: text.trim(),
        user_id: user.id,
        job_id: jobId,
        reply_to_id: reply_to_id || null,
        attachment_url: attachment_url || null,
        attachment_name: attachment_name || null,
        attachment_size: attachment_size || null,
        attachment_type: attachment_type || null,
        status: 'sent',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Message insert error:', insertError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Get user details for response
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, role')
      .eq('id', user.id)
      .single();

    // Transform message for response
    const transformedMessage = {
      id: message.id,
      text: message.text,
      sender: {
        id: message.user_id,
        name: userProfile
          ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
          : 'Anonymous',
        email: userProfile?.email || '',
        role: userProfile?.role || 'viewer',
        isCurrentUser: true,
      },
      timestamp: message.created_at,
      reactions: [],
      replyTo: undefined, // Will be populated if needed
      attachment: message.attachment_url
        ? {
            url: message.attachment_url,
            name: message.attachment_name || '',
            size: message.attachment_size || 0,
            type: message.attachment_type || '',
          }
        : undefined,
      isEdited: false,
      editedAt: null,
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
