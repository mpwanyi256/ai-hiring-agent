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

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to get company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Separate real notification IDs from synthetic ones
    const realNotificationIds: string[] = [];
    const syntheticNotificationIds: string[] = [];

    for (const id of notificationIds) {
      if (id.startsWith('contract-') || id.startsWith('interview-')) {
        syntheticNotificationIds.push(id);
      } else {
        // Validate UUID format for real notifications
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(id)) {
          realNotificationIds.push(id);
        }
      }
    }

    let updatedCount = 0;

    // Update real notifications in the notifications table
    if (realNotificationIds.length > 0) {
      const { error: updateError, count } = await supabase
        .from('notifications')
        .update({
          is_read: markAsRead,
          read_at: markAsRead ? new Date().toISOString() : null,
        })
        .in('id', realNotificationIds)
        .eq('user_id', user.id)
        .eq('company_id', profile.company_id);

      if (updateError) {
        console.error('Error updating real notifications:', updateError);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }

      updatedCount += count || 0;
    }

    // For synthetic notifications, we can't update them directly since they're view-based
    // In a production system, you might want to create actual notification records
    // or track read status separately for synthetic notifications
    if (syntheticNotificationIds.length > 0) {
      console.log(
        `Synthetic notifications marked as ${markAsRead ? 'read' : 'unread'}:`,
        syntheticNotificationIds,
      );
      // For now, we'll just log this. In production, you might want to:
      // 1. Create actual notification records for these synthetic notifications
      // 2. Store read status in a separate table
      // 3. Use user preferences or session storage
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} notifications marked as ${markAsRead ? 'read' : 'unread'}`,
      updatedCount,
      syntheticCount: syntheticNotificationIds.length,
    });
  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
