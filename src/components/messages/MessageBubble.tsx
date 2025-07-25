import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Shield,
  Crown,
  Check,
  CheckCheck,
  Heart,
  ThumbsUp,
  Smile,
  Reply,
  MoreHorizontal,
  Download,
  ExternalLink,
  Edit3,
  Copy,
  Trash2,
  FileText,
  Image,
} from 'lucide-react';
import { Message } from '@/types/messages';
import MessageActions from './MessageActions';

interface MessageBubbleProps {
  message: Message;
  showAvatar: boolean;
  isLastInGroup: boolean;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit?: (messageId: string, newText: string) => void;
  onDelete?: (messageId: string) => void;
  currentUserId?: string;
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

const getStatusIcon = (status?: string) => {
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

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return <Image className="h-5 w-5 text-blue-500" />;
  } else if (fileType === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  } else {
    return <FileText className="h-5 w-5 text-gray-500" />;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar,
  isLastInGroup,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
}) => {
  const isCurrentUser = message.sender.isCurrentUser;

  // Helper function to generate avatar from name
  const getAvatarText = (name: string) => {
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      return nameParts[0][0] + nameParts[1][0];
    }
    return name[0] || '?';
  };

  const canEdit = onEdit && message.sender.isCurrentUser && !message.attachment;
  const canDelete = onDelete && message.sender.isCurrentUser;

  return (
    <div className={`flex space-x-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar */}
      {!isCurrentUser && (
        <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getRoleColor(message.sender.role)} border`}
          >
            {getAvatarText(message.sender.name)}
          </div>
        </div>
      )}

      <div
        className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} space-y-1 relative`}
      >
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
            <p className="text-xs text-gray-600 font-medium">{message.replyTo.sender.name}</p>
            <p className="text-xs text-gray-500 truncate">{message.replyTo.text}</p>
          </div>
        )}

        {/* File Attachment */}
        {message.attachment && (
          <div
            className={`mx-3 mb-2 p-3 bg-gray-50 border border-gray-200 rounded-lg ${!showAvatar && !isCurrentUser ? 'ml-10' : ''}`}
          >
            <div className="flex items-center space-x-3">
              {getFileIcon(message.attachment.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {message.attachment.name}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(message.attachment.size)}</p>
              </div>
              <div className="flex space-x-2">
                {message.attachment.type.startsWith('image/') && (
                  <img
                    src={message.attachment.url}
                    alt={message.attachment.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <button
                  onClick={() => window.open(message.attachment?.url || '#', '_blank')}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Open file"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                <a
                  href={message.attachment.url}
                  download={message.attachment.name}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Message Content */}
        {message.text && (
          <div
            className={`
              relative px-4 py-3 rounded-2xl max-w-sm
              ${
                isCurrentUser
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900 border border-gray-200'
              }
              ${!showAvatar && !isCurrentUser ? 'ml-10' : ''}
            `}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>

            {/* Edited indicator */}
            {message.isEdited && (
              <span
                className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'} italic`}
              >
                {' (edited)'}
              </span>
            )}

            {/* Message Status & Time */}
            <div
              className={`flex items-center justify-end space-x-1 mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-400'}`}
            >
              <span className="text-xs">{formatTime(message.timestamp)}</span>
              {isCurrentUser && getStatusIcon(message.status)}
            </div>
          </div>
        )}

        {/* Message Actions */}
        {(canEdit || canDelete) && (
          <div className={`${isCurrentUser ? 'self-end' : 'self-start'} px-3`}>
            <MessageActions
              message={message}
              onEdit={onEdit!}
              onDelete={onDelete!}
              onReply={onReply}
              canEdit={!!canEdit}
              canDelete={!!canDelete}
            />
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 px-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            {message.reactions.map((reaction) => (
              <button
                key={reaction.id}
                onClick={() => onReaction(message.id, reaction.emoji)}
                className={`
                  flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors
                  ${
                    reaction.hasReacted
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }
                `}
                title={reaction.users.join(', ')}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick Reactions (show on hover) */}
        <div
          className={`
            absolute ${isCurrentUser ? 'right-0' : 'left-0'} -top-6 
            opacity-0 group-hover:opacity-100 transition-opacity
            flex items-center space-x-1 bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1
          `}
        >
          {['❤️', '👍', '😂'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReaction(message.id, emoji)}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            >
              <span className="text-sm">{emoji}</span>
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
  );
};

export default MessageBubble;
