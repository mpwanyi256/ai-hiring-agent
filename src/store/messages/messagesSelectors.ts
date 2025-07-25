import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { Message, TypingUser } from '@/types/messages';

// Base selectors
const selectMessagesState = (state: RootState) => state.messages;

// Current conversation selector
export const selectCurrentConversation = createSelector(
  [selectMessagesState],
  (messagesState) => messagesState.currentConversation,
);

// Loading states
export const selectIsLoading = createSelector(
  [selectMessagesState],
  (messagesState) => messagesState.loading,
);

export const selectIsSendingMessage = createSelector(
  [selectMessagesState],
  (messagesState) => messagesState.sendingMessage,
);

export const selectError = createSelector(
  [selectMessagesState],
  (messagesState) => messagesState.error,
);

// Messages for a specific conversation
export const selectMessagesByConversation = createSelector(
  [selectMessagesState, (_, conversationId: string) => conversationId],
  (messagesState, conversationId) => messagesState.messagesByConversation[conversationId] || [],
);

// Messages for current conversation
export const selectCurrentConversationMessages = createSelector(
  [selectMessagesState],
  (messagesState) => {
    if (!messagesState.currentConversation) return [];
    return messagesState.messagesByConversation[messagesState.currentConversation] || [];
  },
);

// Pagination states
export const selectHasMoreByConversation = createSelector(
  [selectMessagesState, (_, conversationId: string) => conversationId],
  (messagesState, conversationId) => messagesState.hasMore[conversationId] || false,
);

export const selectCurrentConversationHasMore = createSelector(
  [selectMessagesState],
  (messagesState) => {
    if (!messagesState.currentConversation) return false;
    return messagesState.hasMore[messagesState.currentConversation] || false;
  },
);

// Unread count selectors
export const selectUnreadCountByConversation = createSelector(
  [selectMessagesState, (_, conversationId: string) => conversationId],
  (messagesState, conversationId) => messagesState.unreadCount[conversationId] || 0,
);

export const selectCurrentConversationUnreadCount = createSelector(
  [selectMessagesState],
  (messagesState) => {
    if (!messagesState.currentConversation) return 0;
    return messagesState.unreadCount[messagesState.currentConversation] || 0;
  },
);

// Total unread count across all conversations
export const selectTotalUnreadCount = createSelector([selectMessagesState], (messagesState) => {
  return Object.values(messagesState.unreadCount).reduce(
    (total: number, count: number) => total + count,
    0,
  );
});

// Typing indicators
export const selectTypingUsersByConversation = createSelector(
  [selectMessagesState, (_, conversationId: string) => conversationId],
  (messagesState, conversationId) => messagesState.typingUsers[conversationId] || [],
);

export const selectCurrentConversationTypingUsers = createSelector(
  [selectMessagesState],
  (messagesState) => {
    if (!messagesState.currentConversation) return [];
    return messagesState.typingUsers[messagesState.currentConversation] || [];
  },
);

// Typing timeouts (for internal use)
export const selectTypingTimeoutsByConversation = createSelector(
  [selectMessagesState, (_, conversationId: string) => conversationId],
  (messagesState, conversationId) => messagesState.typingTimeouts[conversationId] || {},
);

// Check if a specific user is typing in a conversation
export const selectIsUserTyping = createSelector(
  [selectTypingUsersByConversation, (_, conversationId: string, userId: string) => userId],
  (typingUsers, userId) => typingUsers.some((user: TypingUser) => user.id === userId),
);

// Message utilities
export const selectMessageById = createSelector(
  [selectMessagesByConversation, (_, conversationId: string, messageId: string) => messageId],
  (messages, messageId) => messages.find((message: Message) => message.id === messageId),
);

// Get conversation statistics
export const selectConversationStats = createSelector(
  [selectMessagesByConversation],
  (messages) => {
    const totalMessages = messages.length;
    const participants = new Set(messages.map((m: Message) => m.sender.id));
    const lastMessage = messages[0]; // Messages are sorted newest first

    return {
      totalMessages,
      participantCount: participants.size,
      lastMessage,
      lastActivity: lastMessage?.timestamp || null,
    };
  },
);

// Get current conversation statistics
export const selectCurrentConversationStats = createSelector(
  [selectCurrentConversationMessages],
  (messages) => {
    const totalMessages = messages.length;
    const participants = new Set(messages.map((m: Message) => m.sender.id));
    const lastMessage = messages[0]; // Messages are sorted newest first

    return {
      totalMessages,
      participantCount: participants.size,
      lastMessage,
      lastActivity: lastMessage?.timestamp || null,
    };
  },
);

// Get all active conversations
export const selectActiveConversations = createSelector([selectMessagesState], (messagesState) => {
  return Object.keys(messagesState.messagesByConversation).filter(
    (conversationId) => messagesState.messagesByConversation[conversationId].length > 0,
  );
});

// Get conversation summaries for all active conversations
export const selectConversationSummaries = createSelector(
  [selectMessagesState],
  (messagesState) => {
    return Object.keys(messagesState.messagesByConversation).map((conversationId) => {
      const messages = messagesState.messagesByConversation[conversationId];
      const unreadCount = messagesState.unreadCount[conversationId] || 0;
      const typingUsers = messagesState.typingUsers[conversationId] || [];
      const hasMore = messagesState.hasMore[conversationId] || false;

      const participants = new Set(messages.map((m: Message) => m.sender.id));
      const lastMessage = messages[0]; // Messages are sorted newest first

      return {
        conversationId,
        totalMessages: messages.length,
        participantCount: participants.size,
        lastMessage,
        lastActivity: lastMessage?.timestamp || null,
        unreadCount,
        hasTypingUsers: typingUsers.length > 0,
        hasMore,
      };
    });
  },
);

// Helper to create conversation ID
export const createConversationId = (candidateId: string, jobId: string) => {
  // For job-based conversations, always use just the jobId
  return jobId;
};

// Helper to parse conversation ID
export const parseConversationId = (conversationId: string) => {
  // For job-based conversations, conversationId is just the jobId
  return { candidateId: conversationId, jobId: conversationId };
};
