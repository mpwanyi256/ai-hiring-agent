import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  addNotification,
  updateNotification,
  removeNotification,
} from '@/store/notifications/notificationsSlice';
import { selectUser } from '@/store/auth/authSelectors';
import { createClient } from '@/lib/supabase/client';
import { Notification } from '@/types/notifications';

export const useRealtimeNotifications = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const supabase = createClient();

  const handleRealtimeEvent = useCallback(
    (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      // Only process notifications for the current user to avoid showing notifications for actions they performed
      if (newRecord?.user_id === user?.id) {
        return; // Don't show notifications for the user's own actions
      }

      switch (eventType) {
        case 'INSERT':
          if (newRecord) {
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
            };
            dispatch(addNotification(notification));
          }
          break;

        case 'UPDATE':
          if (newRecord) {
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
            };
            dispatch(updateNotification(notification));
          }
          break;

        case 'DELETE':
          if (oldRecord) {
            dispatch(removeNotification(oldRecord.id));
          }
          break;
      }
    },
    [dispatch, user?.id],
  );

  useEffect(() => {
    if (!user?.id || !user?.companyId) {
      return;
    }

    // Subscribe to notifications for the user's company
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `company_id=eq.${user.companyId}`,
        },
        handleRealtimeEvent,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.companyId, handleRealtimeEvent, supabase]);
};
