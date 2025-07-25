import React, { useRef, useEffect } from 'react';
import { ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { Message, TypingUser } from '@/types/messages';
import MessageBubble from './MessageBubble';
import EmptyState from './EmptyState';

interface MessagesListProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  typingUsers: TypingUser[];
  candidateName?: string;
  currentUserId?: string;
  onLoadMore: () => void;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit: (messageId: string, newText: string) => void;
  onDelete: (messageId: string) => void;
  onStartConversation?: () => void;
}

const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  loading,
  error,
  hasMore,
  typingUsers,
  candidateName,
  currentUserId,
  onLoadMore,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  onStartConversation,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change or typing status changes (contained to messages area only)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && messagesEndRef.current) {
      // For new messages, always scroll to bottom; for typing users, only if near bottom
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      // Auto-scroll to new messages or when typing indicators appear/disappear
      if (isNearBottom || messages.length > 0) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          });
        }, 50); // Small delay to ensure DOM has updated
      }
    }
  }, [messages, typingUsers]);

  // Get typing indicator text
  const getTypingText = () => {
    if (typingUsers.length === 0) return null;

    // Filter out placeholder names and get first names
    const names = typingUsers
      .map((u) => u.name.split(' ')[0])
      .filter((name) => name && name !== 'Current' && name !== 'Anonymous' && name.length > 0);

    if (names.length === 0) return 'Someone is typing...';

    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names.join(' and ')} are typing...`;
    } else {
      return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]} are typing...`;
    }
  };

  return (
    <div className="h-full max-h-[calc(100vh-420px)] flex flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Load More Button */}
        {hasMore && (
          <div className="text-center p-4">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 transition-colors"
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
          <div className="px-3 py-2 space-y-3">
            {messages.map((message, index) => {
              const showAvatar = index === 0 || messages[index - 1].sender.id !== message.sender.id;
              const isLastInGroup =
                index === messages.length - 1 ||
                messages[index + 1].sender.id !== message.sender.id;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showAvatar={showAvatar}
                  isLastInGroup={isLastInGroup}
                  onReaction={onReaction}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  currentUserId={currentUserId}
                />
              );
            })}

            {/* Enhanced Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-3 pl-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <p className="text-sm text-gray-600 italic">{getTypingText()}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessagesList;
