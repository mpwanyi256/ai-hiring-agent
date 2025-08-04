import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { addNotification } from '@/store/notifications/notificationsSlice';
import { selectUser } from '@/store/auth/authSelectors';
import { createClient } from '@/lib/supabase/client';
import { Notification } from '@/types/notifications';
import { RealtimeChannel } from '@supabase/supabase-js';
import { apiSuccess } from '@/lib/notification';

export const useRealtimeNotifications = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const processedNotificationsRef = useRef<Set<string>>(new Set());

  const handleRealtimeEvent = useCallback(
    (payload: any) => {
      const { eventType, new: newRecord } = payload;

      // Only process INSERT events
      if (eventType !== 'INSERT' || !newRecord) {
        return;
      }

      // Prevent duplicate processing of the same notification
      if (processedNotificationsRef.current.has(newRecord.id)) {
        return;
      }

      // Mark this notification as processed
      processedNotificationsRef.current.add(newRecord.id);

      // Only process notifications for the current user
      if (newRecord.user_id !== user?.id) {
        return;
      }

      console.log('New notification received:', newRecord);

      // Show success message
      apiSuccess(`New alert: ${newRecord.title}`);

      // Create notification object
      const notification: Notification = {
        id: newRecord.id,
        type: newRecord.type,
        category: newRecord.category,
        title: newRecord.title,
        message: newRecord.message,
        actionUrl: newRecord.action_url,
        actionText: newRecord.action_text,
        isRead: newRecord.is_read,
        createdAt: newRecord.created_at,
        readAt: newRecord.read_at,
        userId: newRecord.user_id,
        companyId: newRecord.company_id,
        relatedEntityId: newRecord.related_entity_id,
        relatedEntityType: newRecord.related_entity_type,
        timestamp: newRecord.timestamp,
        created_at: newRecord.created_at,
        status: newRecord.status,
        priority: newRecord.priority,
        read: newRecord.read,
        is_read: newRecord.is_read,
        company_id: newRecord.company_id,
        entity_type: newRecord.entity_type,
        entity_id: newRecord.entity_id,
      };

      // Add to Redux store
      dispatch(addNotification(notification));

      // Clean up processed notifications set periodically to prevent memory leaks
      if (processedNotificationsRef.current.size > 1000) {
        processedNotificationsRef.current.clear();
      }
    },
    [dispatch, user?.id],
  );

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    // Clean up existing channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Subscribe to notifications for the current user only
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        handleRealtimeEvent,
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, supabase]); // Removed handleRealtimeEvent from dependencies to prevent recreation

  // Cleanup processed notifications on unmount
  useEffect(() => {
    return () => {
      processedNotificationsRef.current.clear();
    };
  }, []);
};
