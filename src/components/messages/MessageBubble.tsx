import React from 'react';
import { User, Shield, Crown, Check, CheckCheck } from 'lucide-react';
import { Message } from '@/hooks/useMessages';

interface MessageBubbleProps {
  message: Message;
  showAvatar: boolean;
  isLastInGroup: boolean;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
      return <Crown className="h-3 w-3 text-yellow-500" />;
    case 'manager':
      return <Shield className="h-3 w-3 text-purple-500" />;
    case 'engineering':
      return <User className="h-3 w-3 text-blue-500" />;
    case 'hr':
      return <User className="h-3 w-3 text-green-500" />;
    default:
      return <User className="h-3 w-3 text-gray-500" />;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'manager':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'engineering':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'hr':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'sent':
      return <Check className="h-3 w-3 text-gray-400" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-gray-400" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    default:
      return null;
  }
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar,
  isLastInGroup,
  onReaction,
  onReply,
}) => {
  const isCurrentUser = message.sender.isCurrentUser;

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`flex max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}
      >
        {/* Avatar */}
        {!isCurrentUser && (
          <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getRoleColor(message.sender.role)} border`}
            >
              {message.sender.avatar}
            </div>
          </div>
        )}

        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} space-y-1`}>
          {/* Sender Info */}
          {!isCurrentUser && showAvatar && (
            <div className="flex items-center space-x-2 px-3">
              <span className="text-sm font-medium text-gray-900">{message.sender.name}</span>
              {getRoleIcon(message.sender.role)}
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${getRoleColor(message.sender.role)}`}
              >
                {message.sender.role}
              </span>
            </div>
          )}

          {/* Reply Context */}
          {message.replyTo && (
            <div
              className={`mx-3 mb-1 p-2 bg-gray-100 rounded-lg border-l-2 border-gray-300 ${isCurrentUser ? 'bg-blue-50 border-blue-300' : ''}`}
            >
              <p className="text-xs text-gray-600 font-medium">{message.replyTo.sender}</p>
              <p className="text-xs text-gray-500 truncate">{message.replyTo.text}</p>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`relative px-4 py-2 rounded-2xl ${
              isCurrentUser
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-900 shadow-sm border border-gray-200'
            } ${!showAvatar && !isCurrentUser ? 'ml-10' : ''}`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>

            {/* Message Status & Time */}
            <div
              className={`flex items-center justify-end space-x-1 mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-400'}`}
            >
              <span className="text-xs">{formatTime(message.timestamp)}</span>
              {isCurrentUser && getStatusIcon(message.status)}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 px-3">
              {message.reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  onClick={() => onReaction(message.id, reaction.emoji)}
                  className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 text-xs transition-colors"
                  title={reaction.users.join(', ')}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-gray-600">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Reactions (on hover) */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 px-3">
            {['👍', '❤️', '😄'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReaction(message.id, emoji)}
                className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md transition-shadow text-sm"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => onReply(message)}
              className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-xs text-gray-500">↳</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
