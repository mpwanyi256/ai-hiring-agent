import { createClient } from '@/lib/supabase/server';
import { AppRequestParams } from '@/types/api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: AppRequestParams<{ message_id: string }>,
) {
  try {
    const { message_id } = await params;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the message with full details and relationships
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select(
        `
        id,
        text,
        candidate_id,
        job_id,
        user_id,
        reply_to_id,
        attachment_url,
        attachment_name,
        attachment_size,
        attachment_type,
        created_at,
        updated_at,
        edited_at,
        status,
        profiles:user_id (
          first_name,
          last_name,
          email,
          role
        ),
        reply_message:reply_to_id (
          id,
          text,
          profiles:user_id (
            first_name,
            last_name
          )
        )
      `,
      )
      .eq('id', message_id)
      .single();

    if (messageError) {
      console.error('Message fetch error:', messageError);
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get reactions for this message
    const { data: reactions, error: reactionsError } = await supabase
      .from('message_reactions')
      .select(
        `
        emoji,
        user_id,
        profiles:user_id (
          first_name,
          last_name
        )
      `,
      )
      .eq('message_id', message_id);

    if (reactionsError) {
      console.error('Reactions fetch error:', reactionsError);
    }

    // Group reactions by emoji
    const reactionGroups = (reactions || []).reduce((acc: any, reaction: any) => {
      const emoji = reaction.emoji;
      if (!acc[emoji]) {
        acc[emoji] = {
          id: emoji, // Use emoji as ID for consistency
          emoji,
          count: 0,
          users: [],
          hasReacted: false,
        };
      }
      acc[emoji].count++;
      const profile = Array.isArray(reaction.profiles) ? reaction.profiles[0] : reaction.profiles;
      if (profile) {
        const userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        acc[emoji].users.push(userName);
      }
      // Check if current user has reacted
      if (reaction.user_id === user.id) {
        acc[emoji].hasReacted = true;
      }
      return acc;
    }, {});

    const messageReactions = Object.values(reactionGroups);

    // Transform to expected format
    const transformedMessage = {
      id: message.id,
      text: message.text,
      sender: {
        id: message.user_id,
        name: `${(message.profiles as any)?.first_name || ''} ${(message.profiles as any)?.last_name || ''}`.trim(),
        email: (message.profiles as any)?.email || '',
        role: (message.profiles as any)?.role || 'viewer',
        isCurrentUser: message.user_id === user.id,
      },
      timestamp: message.created_at,
      reactions: messageReactions,
      replyTo:
        message.reply_to_id && message.reply_message
          ? {
              id: message.reply_to_id,
              text: (message.reply_message as any)?.text || '',
              sender: {
                name: `${(message.reply_message as any)?.profiles?.first_name || ''} ${(message.reply_message as any)?.profiles?.last_name || ''}`.trim(),
              },
            }
          : undefined,
      attachment: message.attachment_url
        ? {
            url: message.attachment_url,
            name: message.attachment_name || '',
            size: message.attachment_size || 0,
            type: message.attachment_type || '',
          }
        : undefined,
      isEdited: !!message.edited_at,
      editedAt: message.edited_at,
    };

    return NextResponse.json({
      success: true,
      message: transformedMessage,
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ message_id: string }> },
) {
  try {
    const { message_id } = await params;
    const { text } = await request.json();

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

    // Get the message to verify ownership
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('user_id, text, attachment_url')
      .eq('id', message_id)
      .single();

    if (messageError) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Only allow editing by the message owner
    if (message.user_id !== user.id) {
      return NextResponse.json({ error: 'Can only edit your own messages' }, { status: 403 });
    }

    // Don't allow editing messages with attachments
    if (message.attachment_url) {
      return NextResponse.json({ error: 'Cannot edit messages with attachments' }, { status: 400 });
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({
        text: text.trim(),
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', message_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating message:', updateError);
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ message_id: string }> },
) {
  try {
    const { message_id } = await params;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the message to verify ownership and get attachment info
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('user_id, attachment_url, attachment_name')
      .eq('id', message_id)
      .single();

    if (messageError) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Only allow deletion by the message owner
    if (message.user_id !== user.id) {
      return NextResponse.json({ error: 'Can only delete your own messages' }, { status: 403 });
    }

    // If message has an attachment, delete it from storage first
    if (message.attachment_url) {
      // Extract the file path from the URL
      const urlParts = message.attachment_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const candidateId = urlParts[urlParts.length - 2];
      const filePath = `${candidateId}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('message-attachments')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting attachment:', storageError);
        // Continue with message deletion even if file deletion fails
      }
    }

    // Delete the message
    const { error: deleteError } = await supabase.from('messages').delete().eq('id', message_id);

    if (deleteError) {
      console.error('Error deleting message:', deleteError);
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
