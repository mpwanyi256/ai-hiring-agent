import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ message_id: string }> },
) {
  try {
    const { message_id: messageId } = await params;
    const body = await request.json();
    const { emoji } = body;

    if (!messageId || !emoji?.trim()) {
      return NextResponse.json({ error: 'Message ID and emoji are required' }, { status: 400 });
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

    // Get the message to check permissions
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('candidate_id, job_id')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user has permission to view this job's messages
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions')
      .select('permission_level')
      .eq('job_id', message.job_id)
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
      .eq('id', message.job_id)
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

    // Check if reaction already exists
    const { data: existingReaction, error: existingError } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji.trim())
      .maybeSingle();

    if (existingError) {
      console.error('Existing reaction check error:', existingError);
      return NextResponse.json({ error: 'Failed to check existing reaction' }, { status: 500 });
    }

    let action: 'added' | 'removed' = 'added';

    if (existingReaction) {
      // Remove existing reaction (toggle off)
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) {
        console.error('Reaction delete error:', deleteError);
        return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
      }

      action = 'removed';
    } else {
      // Add new reaction
      const { error: insertError } = await supabase.from('message_reactions').insert({
        message_id: messageId,
        user_id: user.id,
        emoji: emoji.trim(),
      });

      if (insertError) {
        console.error('Reaction insert error:', insertError);
        return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
      }

      action = 'added';
    }

    // Get updated reaction counts for this message
    const { data: reactionCounts, error: countsError } = await supabase
      .from('message_reactions')
      .select(
        `
        emoji,
        profiles:user_id (first_name, last_name)
      `,
      )
      .eq('message_id', messageId);

    if (countsError) {
      console.error('Reaction counts error:', countsError);
    }

    // Group reactions by emoji
    const reactionGroups = (reactionCounts || []).reduce((acc: any, reaction: any) => {
      const emoji = reaction.emoji;
      if (!acc[emoji]) {
        acc[emoji] = {
          emoji,
          count: 0,
          users: [],
        };
      }
      acc[emoji].count++;
      const profile = Array.isArray(reaction.profiles) ? reaction.profiles[0] : reaction.profiles;
      if (profile) {
        acc[emoji].users.push(`${profile.first_name || ''} ${profile.last_name || ''}`.trim());
      }
      return acc;
    }, {});

    const reactions = Object.values(reactionGroups);

    return NextResponse.json({
      success: true,
      action,
      reactions,
    });
  } catch (error) {
    console.error('Error handling reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ message_id: string }> },
) {
  try {
    const { message_id: messageId } = await params;
    const { searchParams } = new URL(request.url);
    const emoji = searchParams.get('emoji');

    if (!messageId || !emoji?.trim()) {
      return NextResponse.json({ error: 'Message ID and emoji are required' }, { status: 400 });
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

    // Get the message to check permissions
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('candidate_id, job_id')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check permissions (same as POST)
    const { data: permission } = await supabase
      .from('job_permissions')
      .select('permission_level')
      .eq('job_id', message.job_id)
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: job } = await supabase
      .from('jobs')
      .select('profile_id')
      .eq('id', message.job_id)
      .single();

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

    // Delete the reaction
    const { error: deleteError } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji.trim());

    if (deleteError) {
      console.error('Reaction delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      action: 'removed',
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
