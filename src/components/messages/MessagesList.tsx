import React, { useRef, useEffect } from 'react';
import { ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { Message } from '@/hooks/useMessages';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';

interface MessagesListProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  isTyping: boolean;
  candidateName?: string;
  onLoadMore: () => void;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onStartConversation?: () => void;
}

const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  loading,
  error,
  hasMore,
  isTyping,
  candidateName,
  onLoadMore,
  onReaction,
  onReply,
  onStartConversation,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Load More Button */}
      {hasMore && (
        <div className="text-center p-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            <ChevronUp className="h-4 w-4 inline mr-1" />
            Load older messages
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 m-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && messages.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-600">Loading messages...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && messages.length === 0 && !error && (
        <EmptyState candidateName={candidateName} onStartConversation={onStartConversation} />
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="p-4 space-y-4">
          {messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].sender.id !== message.sender.id;
            const isLastInGroup =
              index === messages.length - 1 || messages[index + 1].sender.id !== message.sender.id;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                showAvatar={showAvatar}
                isLastInGroup={isLastInGroup}
                onReaction={onReaction}
                onReply={onReply}
              />
            );
          })}

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator />}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesList;
