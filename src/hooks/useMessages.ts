import { useState, useEffect, useCallback, useRef } from 'react';

export interface MessageSender {
  id: string;
  name: string;
  role: 'hr' | 'engineering' | 'manager' | 'recruiter' | 'admin' | 'viewer';
  avatar: string;
  isCurrentUser?: boolean;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface MessageReplyTo {
  id: string;
  text: string;
  sender: string;
}

export interface MessageAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  reactions?: MessageReaction[];
  replyTo?: MessageReplyTo;
  editedAt?: string;
  attachment?: MessageAttachment;
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
  sendMessage: (text: string, replyToId?: string, attachment?: File) => Promise<void>;
  sendingMessage: boolean;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  refreshMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  uploadFile: (file: File) => Promise<string>;
}

export function useMessages({
  candidateId,
  jobId,
  enabled = true,
  refreshInterval = 30000, // 30 seconds
}: UseMessagesProps): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [offset, setOffset] = useState(0);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Upload file to storage
  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('candidate_id', candidateId);
      formData.append('job_id', jobId);

      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      return data.url;
    },
    [candidateId, jobId],
  );

  // Mark messages as read
  const markAsRead = useCallback(
    async (messageIds: string[]) => {
      if (!messageIds.length) return;

      try {
        const response = await fetch('/api/messages/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message_ids: messageIds,
            candidate_id: candidateId,
            job_id: jobId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to mark messages as read');
        }

        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    },
    [candidateId, jobId],
  );

  // Fetch messages from API
  const fetchMessages = useCallback(
    async (isLoadMore = false) => {
      if (!candidateId || !jobId || !enabled) return;

      try {
        if (!isLoadMore) {
          setLoading(true);
          setError(null);
        }

        const currentOffset = isLoadMore ? offset : 0;
        const params = new URLSearchParams({
          job_id: jobId,
          limit: '50',
          offset: currentOffset.toString(),
        });

        const response = await fetch(`/api/candidates/${candidateId}/messages?${params}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch messages');
        }

        const data = await response.json();

        if (isLoadMore) {
          setMessages((prev) => [...prev, ...data.messages]);
          setOffset((prev) => prev + data.messages.length);
        } else {
          setMessages(data.messages);
          setOffset(data.messages.length);

          // Auto-mark new messages as read after a short delay
          const newMessages = data.messages.filter(
            (msg: Message) =>
              !msg.sender.isCurrentUser &&
              (!lastMessageIdRef.current || msg.timestamp > lastMessageIdRef.current),
          );

          if (newMessages.length > 0) {
            setTimeout(() => {
              markAsRead(newMessages.map((msg: Message) => msg.id));
            }, 2000);
          }

          // Update last message timestamp
          if (data.messages.length > 0) {
            lastMessageIdRef.current = data.messages[data.messages.length - 1].timestamp;
          }
        }

        setUnreadCount(data.unreadCount || 0);
        setHasMore(data.hasMore || false);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    },
    [candidateId, jobId, enabled, offset, markAsRead],
  );

  // Send a new message
  const sendMessage = useCallback(
    async (text: string, replyToId?: string, attachment?: File) => {
      if (!candidateId || !jobId || (!text.trim() && !attachment)) return;

      setSendingMessage(true);
      setError(null);

      try {
        let attachmentData = null;

        // Upload file if present
        if (attachment) {
          const fileUrl = await uploadFile(attachment);
          attachmentData = {
            url: fileUrl,
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
          };
        }

        const response = await fetch(`/api/candidates/${candidateId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            job_id: jobId,
            text: text.trim() || (attachment ? `Shared: ${attachment.name}` : ''),
            reply_to_id: replyToId || null,
            attachment: attachmentData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();

        // Add the new message to the list optimistically
        setMessages((prev) => [...prev, data.message]);

        // Refresh to get the latest state
        setTimeout(() => {
          fetchMessages();
        }, 1000);
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setSendingMessage(false);
      }
    },
    [candidateId, jobId, fetchMessages, uploadFile],
  );

  // Edit a message
  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!messageId || !newText.trim()) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newText.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to edit message');
      }

      // Update the message in the local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, text: newText.trim(), editedAt: new Date().toISOString() }
            : msg,
        ),
      );
    } catch (err) {
      console.error('Error editing message:', err);
      setError(err instanceof Error ? err.message : 'Failed to edit message');
    }
  }, []);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!messageId) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete message');
      }

      // Remove the message from local state
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, []);

  // Add or toggle reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!messageId || !emoji) return;

    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add reaction');
      }

      const data = await response.json();

      // Update the message with new reactions
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, reactions: data.reactions } : msg)),
      );
    } catch (err) {
      console.error('Error adding reaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
    }
  }, []);

  // Remove reaction
  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!messageId || !emoji) return;

      try {
        const params = new URLSearchParams({ emoji });
        const response = await fetch(`/api/messages/${messageId}/reactions?${params}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove reaction');
        }

        // Refresh messages to get updated reactions
        fetchMessages();
      } catch (err) {
        console.error('Error removing reaction:', err);
        setError(err instanceof Error ? err.message : 'Failed to remove reaction');
      }
    },
    [fetchMessages],
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchMessages(true);
  }, [hasMore, loading, fetchMessages]);

  // Refresh messages manually
  const refreshMessages = useCallback(async () => {
    setOffset(0);
    await fetchMessages(false);
  }, [fetchMessages]);

  // Initial load and polling setup
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchMessages();

    // Set up polling for real-time updates
    if (refreshInterval > 0) {
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages();
      }, refreshInterval);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [enabled, fetchMessages, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    messages,
    loading,
    error,
    unreadCount,
    hasMore,
    sendMessage,
    sendingMessage,
    addReaction,
    removeReaction,
    markAsRead,
    refreshMessages,
    loadMoreMessages,
    editMessage,
    deleteMessage,
    uploadFile,
  };
}
