import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAppDispatch, useAppSelector } from '@/store';
import { Message, TypingUser } from '@/types/messages';
import { selectUser } from '@/store/auth/authSelectors';
import {
  setCurrentConversation,
  clearCurrentConversation,
  setLoading,
  setSendingMessage,
  addMessage,
  updateMessage,
  removeMessage,
  setTypingUser,
  removeTypingUser,
  cleanupTypingUsers,
} from '@/store/messages/messagesSlice';
import {
  fetchMessages as fetchMessagesThunk,
  sendMessage as sendMessageThunk,
  editMessage as editMessageThunk,
  deleteMessage as deleteMessageThunk,
  addReaction as addReactionThunk,
  removeReaction as removeReactionThunk,
  markMessagesAsRead as markMessagesAsReadThunk,
  fetchMessageById,
} from '@/store/messages/messagesThunks';
import {
  selectCurrentConversationMessages,
  selectCurrentConversationUnreadCount,
  selectCurrentConversationHasMore,
  selectCurrentConversationTypingUsers,
  selectIsLoading,
  selectIsSendingMessage,
  selectError,
} from '@/store/messages/messagesSelectors';

interface UseMessagesReduxProps {
  jobId: string;
  enabled?: boolean;
}

interface UseMessagesReduxReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  hasMore: boolean;
  sendingMessage: boolean;
  typingUsers: TypingUser[];
  fetchingNewMessage: boolean;
  sendMessage: (text: string, replyToId?: string, attachment?: File) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  uploadFile: (file: File) => Promise<string>;
  startTyping: () => void;
  stopTyping: () => void;
}

export function useMessagesRedux({
  jobId,
  enabled = true,
}: UseMessagesReduxProps): UseMessagesReduxReturn {
  const dispatch = useAppDispatch();
  const supabase = createClient();

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingNewMessageRef = useRef<boolean>(false);
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, Message>>(new Map());

  // Use consistent conversation ID creation - just use jobId for job-based conversations
  const conversationId = jobId;

  // Get current user from Redux auth state
  const currentUser = useAppSelector(selectUser);

  // Redux selectors
  const messages = useAppSelector((state) => selectCurrentConversationMessages(state));
  const loading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);
  const unreadCount = useAppSelector(selectCurrentConversationUnreadCount);
  const hasMore = useAppSelector(selectCurrentConversationHasMore);
  const sendingMessage = useAppSelector(selectIsSendingMessage);
  const typingUsers = useAppSelector(selectCurrentConversationTypingUsers);

  // Combine real messages with optimistic messages
  const allMessages = [
    ...Array.from(optimisticMessages.values()),
    ...messages.filter((m) => !optimisticMessages.has(m.id)),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Oldest first (newest at bottom)

  // Set current conversation on mount and cleanup on unmount
  useEffect(() => {
    if (enabled && jobId) {
      // For job-based messaging, use jobId as the conversation ID
      dispatch(setCurrentConversation({ candidateId: jobId, jobId }));

      return () => {
        dispatch(clearCurrentConversation());
      };
    }
  }, [dispatch, jobId, enabled]);

  // Setup real-time subscriptions with job-based filtering
  useEffect(() => {
    if (!enabled || !jobId || !currentUser) return;

    const channel = supabase
      .channel(`job-messages:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          fetchingNewMessageRef.current = true;

          // Remove optimistic message if it exists
          const messageId = payload.new.id;
          setOptimisticMessages((prev) => {
            const newMap = new Map(prev);
            newMap.delete(messageId);
            return newMap;
          });

          // Immediately fetch the complete message with user details
          dispatch(
            fetchMessageById({
              messageId: payload.new.id,
              conversationId,
            }),
          )
            .then((action) => {
              fetchingNewMessageRef.current = false;
              if (fetchMessageById.fulfilled.match(action)) {
                dispatch(
                  addMessage({
                    conversationId,
                    message: action.payload.message,
                  }),
                );
              }
            })
            .catch(() => {
              fetchingNewMessageRef.current = false;
            });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          fetchingNewMessageRef.current = true;

          // Fetch updated message details
          dispatch(
            fetchMessageById({
              messageId: payload.new.id,
              conversationId,
            }),
          )
            .then((action) => {
              fetchingNewMessageRef.current = false;
              if (fetchMessageById.fulfilled.match(action)) {
                dispatch(
                  updateMessage({
                    conversationId,
                    message: action.payload.message,
                  }),
                );
              }
            })
            .catch(() => {
              fetchingNewMessageRef.current = false;
            });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          dispatch(removeMessage({ conversationId, messageId: payload.old.id }));
          // Also remove from optimistic messages
          setOptimisticMessages((prev) => {
            const newMap = new Map(prev);
            newMap.delete(payload.old.id);
            return newMap;
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload: any) => {
          // Refresh the specific message to get updated reactions
          const messageId = payload.new.message_id || payload.old.message_id;
          if (messageId) {
            dispatch(
              fetchMessageById({
                messageId,
                conversationId,
              }),
            ).then((action) => {
              if (fetchMessageById.fulfilled.match(action)) {
                dispatch(
                  updateMessage({
                    conversationId,
                    message: action.payload.message,
                  }),
                );
              }
            });
          }
        },
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, user_name, is_typing } = payload.payload;

        // Don't show typing indicator for current user
        if (currentUser && user_id === currentUser.id) {
          return;
        }

        if (is_typing) {
          dispatch(
            setTypingUser({
              conversationId,
              user: { id: user_id, name: user_name, timestamp: Date.now() },
              minDisplayTime: 3000, // 3 seconds minimum display time
            }),
          );
        } else {
          dispatch(
            removeTypingUser({
              conversationId,
              userId: user_id,
              force: false, // Respect minimum display time
            }),
          );
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [jobId, enabled, supabase, dispatch, conversationId, currentUser]);

  // Enhanced typing cleanup with minimum display time respect
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      dispatch(
        cleanupTypingUsers({
          conversationId,
          maxAge: 8000, // Remove after 8 seconds of inactivity
        }),
      );
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, [dispatch, conversationId]);

  const startTyping = useCallback(() => {
    if (channelRef.current && currentUser) {
      const userName =
        currentUser.firstName && currentUser.lastName
          ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
          : currentUser.email || 'Anonymous';

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: currentUser.id,
          user_name: userName,
          is_typing: true,
        },
      });
    }
  }, [currentUser]);

  const stopTyping = useCallback(() => {
    if (channelRef.current && currentUser) {
      const userName =
        currentUser.firstName && currentUser.lastName
          ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
          : currentUser.email || 'Anonymous';

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: currentUser.id,
          user_name: userName,
          is_typing: false,
        },
      });
    }
  }, [currentUser]);

  // API functions with optimistic updates
  const sendMessage = useCallback(
    async (text: string, replyToId?: string, attachment?: File) => {
      if (!enabled || !jobId || !currentUser) return;

      dispatch(setSendingMessage(true));

      // Create optimistic message
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        text,
        sender: {
          id: currentUser.id,
          name:
            currentUser.firstName && currentUser.lastName
              ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
              : currentUser.email || 'Anonymous',
          email: currentUser.email || '',
          role: currentUser.role || 'viewer',
          isCurrentUser: true,
        },
        timestamp: new Date().toISOString(),
        reactions: [],
        replyTo: replyToId ? messages.find((m) => m.id === replyToId)?.replyTo : undefined,
        attachment: undefined, // Will be set if upload succeeds
        isEdited: false,
        status: 'sending',
      };

      // Add optimistic message to local state
      setOptimisticMessages((prev) => new Map(prev).set(tempId, optimisticMessage));

      try {
        await dispatch(
          sendMessageThunk({
            jobId, // Send to job endpoint
            text,
            replyToId,
            attachment,
          }),
        ).unwrap();

        // Remove optimistic message since real one will come via real-time
        setOptimisticMessages((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });

        // Stop typing when message is sent
        stopTyping();
      } catch (error) {
        console.error('Failed to send message:', error);

        // Update optimistic message to show error state
        setOptimisticMessages((prev) => {
          const newMap = new Map(prev);
          const msg = newMap.get(tempId);
          if (msg) {
            newMap.set(tempId, { ...msg, status: 'failed' });
          }
          return newMap;
        });
      } finally {
        dispatch(setSendingMessage(false));
      }
    },
    [dispatch, jobId, enabled, currentUser, messages, stopTyping],
  );

  // Retry failed message
  const retryMessage = useCallback(
    async (tempId: string) => {
      const optimisticMsg = optimisticMessages.get(tempId);
      if (!optimisticMsg) return;

      // Update status to sending
      setOptimisticMessages((prev) => {
        const newMap = new Map(prev);
        newMap.set(tempId, { ...optimisticMsg, status: 'sending' });
        return newMap;
      });

      // Try sending again
      await sendMessage(optimisticMsg.text, optimisticMsg.replyTo?.id);
    },
    [optimisticMessages, sendMessage],
  );

  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await dispatch(addReactionThunk({ messageId, emoji })).unwrap();
      } catch (error) {
        console.error('Failed to add reaction:', error);
      }
    },
    [dispatch],
  );

  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await dispatch(removeReactionThunk({ messageId, emoji })).unwrap();
      } catch (error) {
        console.error('Failed to remove reaction:', error);
      }
    },
    [dispatch],
  );

  const markAsRead = useCallback(async () => {
    if (!enabled || !jobId) return;

    try {
      await dispatch(markMessagesAsReadThunk({ jobId })).unwrap();
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [dispatch, jobId, enabled]);

  const refreshMessages = useCallback(async () => {
    if (!enabled || !jobId) return;

    dispatch(setLoading(true));
    try {
      await dispatch(
        fetchMessagesThunk({
          jobId, // Use job-based endpoint
          offset: 0,
          isLoadMore: false,
        }),
      ).unwrap();
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, jobId, enabled]);

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loading || !enabled || !jobId) return;

    try {
      await dispatch(
        fetchMessagesThunk({
          jobId, // Use job-based endpoint
          offset: messages.length, // Use Redux messages length for offset since they're already sorted correctly
          isLoadMore: true,
        }),
      ).unwrap();
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [dispatch, jobId, messages.length, hasMore, loading, enabled]);

  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      try {
        await dispatch(
          editMessageThunk({
            messageId,
            newText,
            conversationId,
          }),
        ).unwrap();
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    },
    [dispatch, conversationId],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await dispatch(
          deleteMessageThunk({
            messageId,
            conversationId,
          }),
        ).unwrap();
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    },
    [dispatch, conversationId],
  );

  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('job_id', jobId); // Use job_id instead of candidate_id

      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      return data.url;
    },
    [jobId],
  );

  // Initial fetch
  useEffect(() => {
    if (enabled && jobId) {
      dispatch(
        fetchMessagesThunk({
          jobId, // Use job-based endpoint
          offset: 0,
          isLoadMore: false,
        }),
      );
    }
  }, [dispatch, jobId, enabled]);

  // Auto-mark as read when messages are loaded
  useEffect(() => {
    if (allMessages.length > 0 && unreadCount > 0) {
      const timer = setTimeout(markAsRead, 1000);
      return () => clearTimeout(timer);
    }
  }, [allMessages.length, unreadCount, markAsRead]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (currentUser) {
        stopTyping();
      }
    };
  }, [stopTyping, currentUser]);

  return {
    messages: allMessages, // Return combined messages with optimistic updates
    loading,
    error,
    unreadCount,
    hasMore,
    sendingMessage,
    typingUsers,
    fetchingNewMessage: fetchingNewMessageRef.current,
    sendMessage,
    addReaction,
    removeReaction,
    markAsRead,
    refreshMessages,
    loadMoreMessages,
    editMessage,
    deleteMessage,
    uploadFile,
    startTyping,
    stopTyping,
  };
}
