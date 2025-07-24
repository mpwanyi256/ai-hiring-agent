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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const user = useAppSelector(selectUser);
  const candidate = useAppSelector(selectSelectedCandidate);

  // Initialize messaging hook with enhanced real-time features
  const {
    messages,
    loading,
    error,
    unreadCount,
    hasMore,
    sendMessage,
    sendingMessage,
    typingUsers,
    addReaction,
    refreshMessages,
    loadMoreMessages,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
  } = useMessages({
    candidateId: candidate?.id || '',
    jobId: candidate?.jobId || '',
    enabled: !!(candidate?.id && candidate?.jobId),
    refreshInterval: 0, // Disabled since we're using real-time
  });

  const handleSendMessage = async (text: string, replyToId?: string, attachment?: File) => {
    await sendMessage(text, replyToId, attachment);
    setReplyingTo(null); // Clear reply after sending
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

  const handleEdit = async (messageId: string, newText: string) => {
    try {
      await editMessage(messageId, newText);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleStartConversation = () => {
    // Focus the input field when starting conversation
    const inputElement = document.querySelector(
      'input[placeholder*="Type your message"], textarea[placeholder*="Type your message"]',
    ) as HTMLInputElement | HTMLTextAreaElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleTypingStart = () => {
    startTyping();
  };

  const handleTypingStop = () => {
    stopTyping();
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

    // Remove typing indicators from header - they'll be shown in message area instead
    return `${participantCount} team member${participantCount !== 1 ? 's' : ''} participating`;
  };

  const getCandidateName = () => {
    // Try to get real candidate name from the selected candidate
    if (candidate?.name) return candidate.name;
    if (candidate?.firstName && candidate?.lastName) {
      return `${candidate.firstName} ${candidate.lastName}`;
    }
    if (candidate?.firstName) return candidate.firstName;
    if (candidate?.email) return candidate.email;
    return 'this candidate';
  };

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
    <div className="flex flex-col h-[calc(100vh-240px)] md:h-[calc(100vh-180px)] bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header - Mobile optimized */}
      <ChatHeader
        title="Team Discussion"
        subtitle={getSubtitle()}
        unreadCount={unreadCount}
        loading={loading}
        onRefresh={refreshMessages}
      />

      {/* Messages List - Mobile optimized with real-time updates */}
      <MessagesList
        messages={messages}
        loading={loading}
        error={error}
        hasMore={hasMore}
        typingUsers={typingUsers}
        candidateName={getCandidateName()}
        currentUserId={user?.id}
        onLoadMore={loadMoreMessages}
        onReaction={handleReaction}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStartConversation={handleStartConversation}
      />

      {/* Message Input - Enhanced for mobile */}
      <MessageInput
        onSendMessage={handleSendMessage}
        sendingMessage={sendingMessage}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        placeholder={`Message about ${getCandidateName()}...`}
      />
    </div>
  );
};

export default MessagesTab;
