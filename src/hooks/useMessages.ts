import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface MessageSender {
  id: string;
  name: string;
  email: string;
  role: string;
  isCurrentUser: boolean;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export interface MessageReplyTo {
  id: string;
  text: string;
  sender: {
    name: string;
  };
}

export interface MessageAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface Message {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: string;
  reactions: MessageReaction[];
  replyTo?: MessageReplyTo;
  attachment?: MessageAttachment;
  isEdited: boolean;
  editedAt?: string;
}

export interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

interface UseMessagesProps {
  candidateId: string;
  jobId: string;
  enabled?: boolean;
  refreshInterval?: number;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  hasMore: boolean;
  sendingMessage: boolean;
  typingUsers: TypingUser[];
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

export function useMessages({
  candidateId,
  jobId,
  enabled = true,
  refreshInterval = 30000,
}: UseMessagesProps): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user info
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCurrentUser({
            id: user.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous',
          });
        }
      }
    };

    getCurrentUser();
  }, [supabase]);

  // Clean up typing users periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => prev.filter((user) => now - user.timestamp < 8000)); // Increased to 8 seconds
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const fetchMessages = useCallback(
    async (offset = 0, limit = 50) => {
      if (!enabled || !candidateId || !jobId) return;

      try {
        const response = await fetch(
          `/api/candidates/${candidateId}/messages?job_id=${jobId}&limit=${limit}&offset=${offset}`,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();

        if (offset === 0) {
          setMessages(data.messages || []);
          setUnreadCount(data.unreadCount || 0);
        } else {
          setMessages((prev) => [...prev, ...(data.messages || [])]);
        }

        setHasMore(data.hasMore || false);
      } catch (err) {
        console.error('Messages fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    },
    [candidateId, jobId, enabled],
  );

  // Setup real-time subscriptions
  useEffect(() => {
    if (!enabled || !candidateId || !jobId) return;

    const channel = supabase
      .channel(`messages:${candidateId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `candidate_id=eq.${candidateId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          // Fetch the complete message with user details
          fetchMessageById(payload.new.id);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `candidate_id=eq.${candidateId}`,
        },
        (payload) => {
          console.log('Message updated:', payload);
          fetchMessageById(payload.new.id);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `candidate_id=eq.${candidateId}`,
        },
        (payload) => {
          console.log('Message deleted:', payload);
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          console.log('Reaction updated:', payload);
          refreshMessages();
        },
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, user_name, is_typing } = payload.payload;

        // Don't show typing indicator for current user
        if (currentUser && user_id === currentUser.id) {
          return;
        }

        if (is_typing) {
          setTypingUsers((prev) => {
            const filtered = prev.filter((u) => u.id !== user_id);
            return [...filtered, { id: user_id, name: user_name, timestamp: Date.now() }];
          });
        } else {
          setTypingUsers((prev) => prev.filter((u) => u.id !== user_id));
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
  }, [candidateId, jobId, enabled, supabase]);

  const fetchMessageById = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`);
      if (response.ok) {
        const messageData = await response.json();
        setMessages((prev) => {
          const existing = prev.find((msg) => msg.id === messageId);
          if (existing) {
            // Update existing message
            return prev.map((msg) => (msg.id === messageId ? messageData.message : msg));
          } else {
            // Add new message
            return [messageData.message, ...prev];
          }
        });
      }
    } catch (error) {
      console.error('Error fetching message:', error);
    }
  };

  const sendMessage = async (text: string, replyToId?: string, attachment?: File) => {
    if (!enabled || !candidateId || !jobId) return;

    setSendingMessage(true);

    try {
      let attachmentData = null;

      if (attachment) {
        const uploadedUrl = await uploadFile(attachment);
        attachmentData = {
          attachment_url: uploadedUrl,
          attachment_name: attachment.name,
          attachment_size: attachment.size,
          attachment_type: attachment.type,
        };
      }

      const response = await fetch(`/api/candidates/${candidateId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          reply_to_id: replyToId,
          job_id: jobId,
          ...attachmentData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Stop typing when message is sent
      stopTyping();

      // Message will be added via real-time subscription
    } catch (err) {
      console.error('Send message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }

      // Reaction will be updated via real-time subscription
    } catch (err) {
      console.error('Add reaction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
    }
  };

  const removeReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove reaction');
      }

      // Reaction will be updated via real-time subscription
    } catch (err) {
      console.error('Remove reaction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove reaction');
    }
  };

  const markAsRead = async () => {
    if (!enabled || !candidateId || !jobId) return;

    try {
      const response = await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          job_id: jobId,
        }),
      });

      if (response.ok) {
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const refreshMessages = async () => {
    setLoading(true);
    await fetchMessages(0);
  };

  const loadMoreMessages = async () => {
    if (hasMore && !loading) {
      await fetchMessages(messages.length);
    }
  };

  const editMessage = async (messageId: string, newText: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newText }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      // Message will be updated via real-time subscription
    } catch (err) {
      console.error('Edit message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to edit message');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Message will be removed via real-time subscription
    } catch (err) {
      console.error('Delete message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('candidate_id', candidateId);
    formData.append('job_id', jobId);

    const response = await fetch('/api/messages/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return data.url;
  };

  const startTyping = () => {
    if (channelRef.current && currentUser) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: currentUser.id,
          user_name: currentUser.name,
          is_typing: true,
        },
      });
    }
  };

  const stopTyping = () => {
    if (channelRef.current && currentUser) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: currentUser.id,
          user_name: currentUser.name,
          is_typing: false,
        },
      });
    }
  };

  // Initial fetch
  useEffect(() => {
    if (enabled && candidateId && jobId) {
      fetchMessages();
    }
  }, [fetchMessages, enabled, candidateId, jobId]);

  // Auto-mark as read when messages are loaded
  useEffect(() => {
    if (messages.length > 0 && unreadCount > 0) {
      const timer = setTimeout(markAsRead, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, unreadCount]);

  return {
    messages,
    loading,
    error,
    unreadCount,
    hasMore,
    sendingMessage,
    typingUsers,
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
