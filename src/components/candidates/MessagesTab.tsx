import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAppSelector } from '@/store';
import { selectUser } from '@/store/auth/authSelectors';
import { selectSelectedCandidate } from '@/store/selectedCandidate/selectedCandidateSelectors';
import { useMessages, Message } from '@/hooks/useMessages';
import ChatHeader from '../messages/ChatHeader';
import MessagesList from '../messages/MessagesList';
import MessageInput from '../messages/MessageInput';

const MessagesTab: React.FC = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const user = useAppSelector(selectUser);
  const candidate = useAppSelector(selectSelectedCandidate);

  // Initialize messaging hook
  const {
    messages,
    loading,
    error,
    unreadCount,
    hasMore,
    sendMessage,
    sendingMessage,
    addReaction,
    refreshMessages,
    loadMoreMessages,
  } = useMessages({
    candidateId: candidate?.id || '',
    jobId: candidate?.jobId || '',
    enabled: !!(candidate?.id && candidate?.jobId),
    refreshInterval: 30000, // 30 seconds
  });

  const handleSendMessage = async (text: string, replyToId?: string) => {
    await sendMessage(text, replyToId);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleStartConversation = () => {
    // Focus the input field when starting conversation
    const inputElement = document.querySelector(
      'input[placeholder="Type your message..."]',
    ) as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  const getUniqueParticipants = () => {
    const participants = messages
      .filter((m) => !m.sender.isCurrentUser)
      .map((m) => m.sender.name)
      .filter((name, index, arr) => arr.indexOf(name) === index);
    return participants.length;
  };

  const getSubtitle = () => {
    const participantCount = getUniqueParticipants();
    return `${participantCount} team member${participantCount !== 1 ? 's' : ''} participating`;
  };

  const getCandidateName = () => {
    // This should be fetched from candidate data
    // For now, return a generic name
    return candidate?.name || 'this candidate';
  };

  // Simulate typing indicator when there's activity
  useEffect(() => {
    if (messages.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Show loading state if candidate data is not available
  if (!candidate?.id || !candidate?.jobId) {
    return (
      <div className="flex flex-col h-[calc(100vh-300px)] bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No candidate selected</p>
            <p className="text-xs text-gray-400 mt-1">Please select a candidate to view messages</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] bg-gray-50 rounded-lg border border-gray-200">
      {/* Header */}
      <ChatHeader
        title="Team Discussion"
        subtitle={getSubtitle()}
        unreadCount={unreadCount}
        loading={loading}
        onRefresh={refreshMessages}
      />

      {/* Messages List */}
      <MessagesList
        messages={messages}
        loading={loading}
        error={error}
        hasMore={hasMore}
        isTyping={isTyping}
        candidateName={getCandidateName()}
        onLoadMore={loadMoreMessages}
        onReaction={handleReaction}
        onReply={handleReply}
        onStartConversation={handleStartConversation}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        sendingMessage={sendingMessage}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
        placeholder="Type your message..."
      />
    </div>
  );
};

export default MessagesTab;
