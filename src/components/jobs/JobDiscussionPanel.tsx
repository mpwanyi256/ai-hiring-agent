import React, { useState } from 'react';
import { AlertCircle, MessageSquare, Users, RefreshCw } from 'lucide-react';
import { useAppSelector } from '@/store';
import { selectUser } from '@/store/auth/authSelectors';
import { selectCurrentJob } from '@/store/jobs/jobsSelectors';
import { useMessagesRedux } from '@/hooks/useMessagesRedux';
import { Message } from '@/types/messages';
import ChatHeader from '../messages/ChatHeader';
import MessagesList from '../messages/MessagesList';
import MessageInput from '../messages/MessageInput';

interface JobDiscussionPanelProps {
  className?: string;
}

const JobDiscussionPanel: React.FC<JobDiscussionPanelProps> = ({ className = '' }) => {
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const user = useAppSelector(selectUser);
  const job = useAppSelector(selectCurrentJob);

  // Initialize job-based messaging hook
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
  } = useMessagesRedux({
    jobId: job?.id || '',
    enabled: !!job?.id,
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

    return `${participantCount} team member${participantCount !== 1 ? 's' : ''} participating`;
  };

  // Show loading state if job data is not available
  if (!job?.id) {
    return (
      <div className={`flex flex-col bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No job selected</p>
            <p className="text-xs text-gray-400 mt-1">Please select a job to view discussions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Team Discussion</h3>
              <p className="text-sm text-gray-500 flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{getSubtitle()}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
            <button
              onClick={refreshMessages}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh messages"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessagesList
          messages={messages}
          loading={loading}
          error={error}
          hasMore={hasMore}
          typingUsers={typingUsers}
          candidateName={job.title}
          currentUserId={user?.id}
          onLoadMore={loadMoreMessages}
          onReaction={handleReaction}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStartConversation={handleStartConversation}
        />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 flex-shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          sendingMessage={sendingMessage}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          placeholder={`Discuss ${job.title}...`}
        />
      </div>
    </div>
  );
};

export default JobDiscussionPanel;
