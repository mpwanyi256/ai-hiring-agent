import { createAsyncThunk } from '@reduxjs/toolkit';
import { Message } from '@/types/messages';
import {
  setMessages,
  loadMoreMessages,
  setHasMore,
  setUnreadCount,
  setError,
  removeMessage,
} from './messagesSlice';

// Fetch messages for a job conversation
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (
    {
      jobId,
      offset = 0,
      limit = 50,
      isLoadMore = false,
    }: {
      jobId: string;
      offset?: number;
      limit?: number;
      isLoadMore?: boolean;
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/messages?limit=${limit}&offset=${offset}`);

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      const conversationId = jobId; // Use jobId as conversationId

      if (isLoadMore) {
        dispatch(
          loadMoreMessages({
            conversationId,
            messages: data.messages || [],
          }),
        );
      } else {
        dispatch(
          setMessages({
            conversationId,
            messages: data.messages || [],
          }),
        );
      }

      dispatch(
        setHasMore({
          conversationId,
          hasMore: data.hasMore || false,
        }),
      );

      dispatch(
        setUnreadCount({
          conversationId,
          count: data.unreadCount || 0,
        }),
      );

      return {
        messages: data.messages || [],
        hasMore: data.hasMore || false,
        unreadCount: data.unreadCount || 0,
        conversationId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  },
);

// Send a new message to a job
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (
    {
      jobId,
      text,
      replyToId,
      attachment,
    }: {
      jobId: string;
      text: string;
      replyToId?: string;
      attachment?: File;
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      let attachmentData = null;

      if (attachment) {
        // Upload file first
        const formData = new FormData();
        formData.append('file', attachment);
        formData.append('job_id', jobId);

        const uploadResponse = await fetch('/api/messages/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadData = await uploadResponse.json();
        attachmentData = {
          attachment_url: uploadData.url,
          attachment_name: attachment.name,
          attachment_size: attachment.size,
          attachment_type: attachment.type,
        };
      }

      const response = await fetch(`/api/jobs/${jobId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          reply_to_id: replyToId,
          ...attachmentData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  },
);

// Edit a message
export const editMessage = createAsyncThunk(
  'messages/editMessage',
  async (
    {
      messageId,
      newText,
      conversationId,
    }: {
      messageId: string;
      newText: string;
      conversationId: string;
    },
    { dispatch, rejectWithValue },
  ) => {
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

      const data = await response.json();
      return { conversationId, message: data.message };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to edit message';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  },
);

// Delete a message
export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async (
    {
      messageId,
      conversationId,
    }: {
      messageId: string;
      conversationId: string;
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      dispatch(removeMessage({ conversationId, messageId }));
      return { conversationId, messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  },
);

// Add reaction to a message
export const addReaction = createAsyncThunk(
  'messages/addReaction',
  async (
    {
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    },
    { dispatch, rejectWithValue },
  ) => {
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

      return { messageId, emoji };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add reaction';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  },
);

// Remove reaction from a message
export const removeReaction = createAsyncThunk(
  'messages/removeReaction',
  async (
    {
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    },
    { dispatch, rejectWithValue },
  ) => {
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

      return { messageId, emoji };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove reaction';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  },
);

// Mark messages as read for a job
export const markMessagesAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (
    {
      jobId,
    }: {
      jobId: string;
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark messages as read');
      }

      const data = await response.json();
      const conversationId = jobId; // Use jobId as conversationId

      dispatch(
        setUnreadCount({
          conversationId,
          count: data.unreadCount || 0,
        }),
      );

      return { conversationId, unreadCount: data.unreadCount || 0 };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to mark messages as read';
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  },
);

// Fetch individual message (for real-time updates) - Updated to properly transform the API response
export const fetchMessageById = createAsyncThunk(
  'messages/fetchMessageById',
  async (
    {
      messageId,
      conversationId,
    }: {
      messageId: string;
      conversationId: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch message');
      }

      const data = await response.json();

      // The API now returns the properly transformed message
      const transformedMessage: Message = data.message;

      return { conversationId, message: transformedMessage };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch message';
      return rejectWithValue(errorMessage);
    }
  },
);
