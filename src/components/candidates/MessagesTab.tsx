import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  User,
  Shield,
  Crown,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useAppSelector } from '@/store';
import { selectUser } from '@/store/auth/authSelectors';

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    role: 'hr' | 'engineering' | 'manager' | 'recruiter' | 'admin';
    avatar?: string;
    isCurrentUser?: boolean;
  };
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  replyTo?: {
    id: string;
    text: string;
    sender: string;
  };
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

const mockMessages: Message[] = [
  {
    id: '1',
    sender: {
      id: '1',
      name: 'Jane Rodriguez',
      role: 'hr',
      avatar: 'JR',
    },
    text: "I just finished reviewing this candidate's profile. The technical background looks really strong, especially the React and Node.js experience.",
    timestamp: '2025-01-22T13:00:00Z',
    status: 'read',
    reactions: [{ emoji: '👍', count: 2, users: ['alex', 'sam'] }],
  },
  {
    id: '2',
    sender: {
      id: '2',
      name: 'Alex Chen',
      role: 'engineering',
      avatar: 'AC',
    },
    text: 'Agreed! I particularly like their open source contributions. Shows genuine passion for the field.',
    timestamp: '2025-01-22T13:05:00Z',
    status: 'read',
    replyTo: {
      id: '1',
      text: 'The technical background looks really strong...',
      sender: 'Jane Rodriguez',
    },
  },
  {
    id: '3',
    sender: {
      id: '3',
      name: 'Sam Williams',
      role: 'manager',
      avatar: 'SW',
    },
    text: "What about their communication skills from the interview responses? That's crucial for our team environment.",
    timestamp: '2025-01-22T13:10:00Z',
    status: 'delivered',
  },
  {
    id: '4',
    sender: {
      id: '1',
      name: 'Jane Rodriguez',
      role: 'hr',
      avatar: 'JR',
    },
    text: 'Great point Sam! From what I can see in their interview responses, they articulated their thoughts clearly and provided detailed explanations. The AI analysis also rated their communication highly.',
    timestamp: '2025-01-22T13:15:00Z',
    status: 'sent',
  },
  {
    id: '5',
    sender: {
      id: '4',
      name: 'You',
      role: 'recruiter',
      avatar: 'ME',
      isCurrentUser: true,
    },
    text: 'Should we move forward with a technical interview? I think they would be a great fit for the senior developer position.',
    timestamp: '2025-01-22T13:18:00Z',
    status: 'sent',
  },
];

const MessagesTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const user = useAppSelector(selectUser);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: (messages.length + 1).toString(),
      sender: {
        id: 'current-user',
        name: 'You',
        role: 'recruiter',
        avatar: user?.firstName?.charAt(0) + (user?.lastName?.charAt(0) || ''),
        isCurrentUser: true,
      },
      text: input,
      timestamp: new Date().toISOString(),
      status: 'sent',
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            text:
              replyingTo.text.length > 50
                ? replyingTo.text.substring(0, 50) + '...'
                : replyingTo.text,
            sender: replyingTo.sender.name,
          }
        : undefined,
    };

    setMessages([...messages, newMessage]);
    setInput('');
    setReplyingTo(null);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(
      messages.map((msg) => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions?.find((r) => r.emoji === emoji);
          if (existingReaction) {
            // Toggle reaction
            const updatedReactions = msg
              .reactions!.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count > 0 ? r.count - 1 : 0 } : r,
              )
              .filter((r) => r.count > 0);
            return { ...msg, reactions: updatedReactions };
          } else {
            // Add new reaction
            const newReaction = { emoji, count: 1, users: ['current-user'] };
            return {
              ...msg,
              reactions: msg.reactions ? [...msg.reactions, newReaction] : [newReaction],
            };
          }
        }
        return msg;
      }),
    );
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Simulate typing indicator
    if (input.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [input]);

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] bg-gray-50 rounded-lg border border-gray-200">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Team Discussion</h3>
            <p className="text-sm text-gray-500">
              {
                messages
                  .filter((m) => !m.sender.isCurrentUser)
                  .map((m) => m.sender.name)
                  .filter((name, index, arr) => arr.indexOf(name) === index).length
              }{' '}
              team members participating
            </p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isCurrentUser = message.sender.isCurrentUser;
          const showAvatar = index === 0 || messages[index - 1].sender.id !== message.sender.id;
          const isLastInGroup =
            index === messages.length - 1 || messages[index + 1].sender.id !== message.sender.id;

          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
            >
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

                <div
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  {/* Sender Info */}
                  {!isCurrentUser && showAvatar && (
                    <div className="flex items-center space-x-2 px-3">
                      <span className="text-sm font-medium text-gray-900">
                        {message.sender.name}
                      </span>
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
                          onClick={() => handleReaction(message.id, reaction.emoji)}
                          className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 text-xs transition-colors"
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
                        onClick={() => handleReaction(message.id, emoji)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md transition-shadow text-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      onClick={() => setReplyingTo(message)}
                      className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="text-xs text-gray-500">↳</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-200 rounded-2xl px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">Someone is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Context Bar */}
      {replyingTo && (
        <div className="bg-blue-50 border-t border-blue-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">↳ Replying to</span>
              <span className="text-sm font-medium text-blue-800">{replyingTo.sender.name}</span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-blue-700 truncate mt-1">{replyingTo.text}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 rounded-b-lg">
        <div className="flex items-end space-x-2">
          {/* Attachment Button */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Input Field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            {/* Emoji Button */}
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 transition-colors">
              <Smile className="h-4 w-4" />
            </button>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`p-2 rounded-lg transition-all ${
              input.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Message Hints */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift + Enter for new line</span>
          <span>{input.length}/1000</span>
        </div>
      </div>
    </div>
  );
};

export default MessagesTab;
