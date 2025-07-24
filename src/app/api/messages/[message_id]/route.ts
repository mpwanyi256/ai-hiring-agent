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

    // Get the message with full details using the RPC function
    const { data: messageData, error: messageError } = await supabase
      .rpc('get_candidate_messages', {
        p_candidate_id: '', // We'll get this from the message
        p_job_id: '', // We'll get this from the message
        p_limit: 1,
        p_offset: 0,
      })
      .eq('id', message_id)
      .single();

    if (messageError) {
      // Fallback to direct query if RPC fails
      const { data: message, error: directError } = await supabase
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
          profiles:user_id (
            first_name,
            last_name,
            email,
            role
          )
        `,
        )
        .eq('id', message_id)
        .single();

      if (directError) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      // Transform to expected format
      const transformedMessage = {
        id: message.id,
        text: message.text,
        sender: {
          id: message.user_id,
          name: `${(message.profiles as any)?.first_name || ''} ${(message.profiles as any)?.last_name || ''}`.trim(),
          email: (message.profiles as any)?.email || '',
          role: (message.profiles as any)?.role || '',
          isCurrentUser: message.user_id === user.id,
        },
        timestamp: message.created_at,
        reactions: [], // We'll need to fetch these separately
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
    }

    return NextResponse.json({
      success: true,
      message: messageData,
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { message_id: string } }) {
  try {
    const { message_id } = params;
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

export async function DELETE(request: NextRequest, { params }: { params: { message_id: string } }) {
  try {
    const { message_id } = params;

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
