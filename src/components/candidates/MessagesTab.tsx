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
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

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
    editMessage,
    deleteMessage,
  } = useMessages({
    candidateId: candidate?.id || '',
    jobId: candidate?.jobId || '',
    enabled: !!(candidate?.id && candidate?.jobId),
    refreshInterval: 30000, // 30 seconds
  });

  const handleSendMessage = async (text: string, replyToId?: string, attachment?: File) => {
    await sendMessage(text, replyToId, attachment);
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
      'input[placeholder*="Type your message"], input[placeholder*="Add a caption"]',
    ) as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleTypingStart = () => {
    if (user?.id && !typingUsers.has(user.id)) {
      setTypingUsers((prev) => new Set([...prev, user.id]));
      // In a real implementation, you'd send this to other users via WebSocket
    }
  };

  const handleTypingStop = () => {
    if (user?.id) {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
      // In a real implementation, you'd send this to other users via WebSocket
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
    if (typingUsers.size > 0) {
      return `Someone is typing...`;
    }
    return `${participantCount} team member${participantCount !== 1 ? 's' : ''} participating`;
  };

  const getCandidateName = () => {
    // Try to get real candidate name from the selected candidate
    // You might need to fetch this from the API or store
    if (candidate?.name) return candidate.name;
    if (candidate?.firstName && candidate?.lastName) {
      return `${candidate.firstName} ${candidate.lastName}`;
    }
    if (candidate?.firstName) return candidate.firstName;
    if (candidate?.email) return candidate.email;
    return 'this candidate';
  };

  // Enhanced typing indicator logic
  useEffect(() => {
    if (typingUsers.size > 0) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [typingUsers]);

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
        currentUserId={user?.id}
        onLoadMore={loadMoreMessages}
        onReaction={handleReaction}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStartConversation={handleStartConversation}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        sendingMessage={sendingMessage}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        placeholder="Type your message..."
      />
    </div>
  );
};

export default MessagesTab;
