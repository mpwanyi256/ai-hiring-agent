import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, TypingUser } from '@/types/messages';

export interface MessagesState {
  // Messages data
  messagesByConversation: Record<string, Message[]>; // Key: jobId for job-based conversations

  // Loading states
  loading: boolean;
  sendingMessage: boolean;
  error: string | null;

  // Pagination
  hasMore: Record<string, boolean>;
  unreadCount: Record<string, number>;

  // Real-time features
  typingUsers: Record<string, TypingUser[]>;
  typingTimeouts: Record<string, Record<string, number>>; // conversationId -> userId -> timestamp

  // Current conversation
  currentConversation: string | null; // jobId for job-based conversations
}

const initialState: MessagesState = {
  messagesByConversation: {},
  loading: false,
  sendingMessage: false,
  error: null,
  hasMore: {},
  unreadCount: {},
  typingUsers: {},
  typingTimeouts: {},
  currentConversation: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Conversation management
    setCurrentConversation: (
      state,
      action: PayloadAction<{ candidateId: string; jobId: string }>,
    ) => {
      const { jobId } = action.payload;
      state.currentConversation = jobId;
    },

    clearCurrentConversation: (state) => {
      state.currentConversation = null;
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setSendingMessage: (state, action: PayloadAction<boolean>) => {
      state.sendingMessage = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Messages management
    setMessages: (
      state,
      action: PayloadAction<{ conversationId: string; messages: Message[] }>,
    ) => {
      const { conversationId, messages } = action.payload;
      state.messagesByConversation[conversationId] = messages;
    },

    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }

      // Check if message already exists to avoid duplicates
      const exists = state.messagesByConversation[conversationId].some((m) => m.id === message.id);
      if (!exists) {
        state.messagesByConversation[conversationId].unshift(message);
      }
    },

    updateMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;
      if (state.messagesByConversation[conversationId]) {
        const index = state.messagesByConversation[conversationId].findIndex(
          (m) => m.id === message.id,
        );
        if (index !== -1) {
          state.messagesByConversation[conversationId][index] = message;
        }
      }
    },

    removeMessage: (
      state,
      action: PayloadAction<{ conversationId: string; messageId: string }>,
    ) => {
      const { conversationId, messageId } = action.payload;
      if (state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = state.messagesByConversation[
          conversationId
        ].filter((m) => m.id !== messageId);
      }
    },

    loadMoreMessages: (
      state,
      action: PayloadAction<{ conversationId: string; messages: Message[] }>,
    ) => {
      const { conversationId, messages } = action.payload;
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }
      state.messagesByConversation[conversationId].push(...messages);
    },

    // Pagination management
    setHasMore: (state, action: PayloadAction<{ conversationId: string; hasMore: boolean }>) => {
      const { conversationId, hasMore } = action.payload;
      state.hasMore[conversationId] = hasMore;
    },

    // Unread count management
    setUnreadCount: (state, action: PayloadAction<{ conversationId: string; count: number }>) => {
      const { conversationId, count } = action.payload;
      state.unreadCount[conversationId] = count;
    },

    decrementUnreadCount: (
      state,
      action: PayloadAction<{ conversationId: string; amount?: number }>,
    ) => {
      const { conversationId, amount = 1 } = action.payload;
      const current = state.unreadCount[conversationId] || 0;
      state.unreadCount[conversationId] = Math.max(0, current - amount);
    },

    // Typing indicators with timeout management
    setTypingUser: (
      state,
      action: PayloadAction<{
        conversationId: string;
        user: TypingUser;
        minDisplayTime?: number; // Minimum time to show typing indicator (ms)
      }>,
    ) => {
      const { conversationId, user, minDisplayTime = 3000 } = action.payload;

      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }

      if (!state.typingTimeouts[conversationId]) {
        state.typingTimeouts[conversationId] = {};
      }

      // Remove existing user and add with new timestamp
      state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
        (u) => u.id !== user.id,
      );

      state.typingUsers[conversationId].push(user);

      // Set minimum display timeout
      const now = Date.now();
      state.typingTimeouts[conversationId][user.id] = now + minDisplayTime;
    },

    removeTypingUser: (
      state,
      action: PayloadAction<{
        conversationId: string;
        userId: string;
        force?: boolean; // Force removal even if within minimum display time
      }>,
    ) => {
      const { conversationId, userId, force = false } = action.payload;

      if (!state.typingUsers[conversationId]) return;

      const now = Date.now();
      const minTimeout = state.typingTimeouts[conversationId]?.[userId] || 0;

      // Only remove if force is true or minimum display time has passed
      if (force || now >= minTimeout) {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          (u) => u.id !== userId,
        );

        if (state.typingTimeouts[conversationId]) {
          delete state.typingTimeouts[conversationId][userId];
        }
      }
    },

    cleanupTypingUsers: (
      state,
      action: PayloadAction<{ conversationId: string; maxAge?: number }>,
    ) => {
      const { conversationId, maxAge = 8000 } = action.payload;

      if (!state.typingUsers[conversationId]) return;

      const now = Date.now();

      // Remove users whose typing timestamp is too old, but respect minimum display time
      state.typingUsers[conversationId] = state.typingUsers[conversationId].filter((user) => {
        const isExpired = now - user.timestamp > maxAge;
        const minTimeout = state.typingTimeouts[conversationId]?.[user.id] || 0;
        const pastMinTime = now >= minTimeout;

        return !isExpired || !pastMinTime;
      });

      // Clean up timeout records for removed users
      if (state.typingTimeouts[conversationId]) {
        const activeUserIds = new Set(state.typingUsers[conversationId].map((u) => u.id));
        Object.keys(state.typingTimeouts[conversationId]).forEach((userId) => {
          if (!activeUserIds.has(userId)) {
            delete state.typingTimeouts[conversationId][userId];
          }
        });
      }
    },

    // Clear conversation data
    clearConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      delete state.messagesByConversation[conversationId];
      delete state.hasMore[conversationId];
      delete state.unreadCount[conversationId];
      delete state.typingUsers[conversationId];
      delete state.typingTimeouts[conversationId];
    },

    // Reset all state
    resetMessages: (state) => {
      return initialState;
    },
  },
});

export const {
  setCurrentConversation,
  clearCurrentConversation,
  setLoading,
  setSendingMessage,
  setError,
  setMessages,
  addMessage,
  updateMessage,
  removeMessage,
  loadMoreMessages,
  setHasMore,
  setUnreadCount,
  decrementUnreadCount,
  setTypingUser,
  removeTypingUser,
  cleanupTypingUsers,
  clearConversation,
  resetMessages,
} = messagesSlice.actions;

export default messagesSlice.reducer;
