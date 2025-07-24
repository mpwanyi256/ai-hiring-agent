import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
