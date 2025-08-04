import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NotificationsResponse } from '@/types/notifications';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user from Supabase auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's company ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Use the notifications_details view for simplified querying
    const {
      data: notifications,
      error,
      count,
    } = await supabase
      .from('notifications_details')
      .select('*', { count: 'exact' })
      .eq('company_id', profile.company_id)
      .is('read_at', null)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    const response: NotificationsResponse = {
      success: true,
      error: null,
      notifications: notifications || [],
      total: count || 0,
      unreadCount: notifications?.filter((n) => !n.read).length || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
        notifications: [],
        total: 0,
        unreadCount: 0,
      } as NotificationsResponse,
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { notificationIds, markAsRead } = await request.json();
    const supabase = await createClient();

    // Validate input
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'No notification IDs provided' }, { status: 400 });
    }

    if (typeof markAsRead !== 'boolean') {
      return NextResponse.json({ error: 'markAsRead must be a boolean' }, { status: 400 });
    }

    // Validate UUID format for notification IDs
    const validNotificationIds: string[] = [];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    for (const id of notificationIds) {
      if (uuidRegex.test(id)) {
        validNotificationIds.push(id);
      } else {
        console.warn('Invalid notification ID format:', id);
      }
    }

    if (validNotificationIds.length === 0) {
      return NextResponse.json({ error: 'No valid notification IDs provided' }, { status: 400 });
    }

    // Update notifications in the notifications table
    // RLS policies will handle user/company access control
    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        is_read: markAsRead,
        read_at: markAsRead ? new Date().toISOString() : null,
      })
      .in('id', validNotificationIds);

    if (updateError) {
      console.error('Error updating notifications:', updateError);
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${validNotificationIds.length} notifications marked as ${markAsRead ? 'read' : 'unread'}`,
    });
  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
