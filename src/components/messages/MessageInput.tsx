import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Loader2 } from 'lucide-react';
import { Message } from '@/hooks/useMessages';

interface MessageInputProps {
  onSendMessage: (text: string, replyToId?: string) => Promise<void>;
  sendingMessage: boolean;
  replyingTo: Message | null;
  onCancelReply: () => void;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  sendingMessage,
  replyingTo,
  onCancelReply,
  placeholder = 'Type your message...',
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!input.trim() || sendingMessage) return;

    try {
      await onSendMessage(input, replyingTo?.id);
      setInput('');
      onCancelReply();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200">
      {/* Reply Context Bar */}
      {replyingTo && (
        <div className="bg-blue-50 border-t border-blue-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">↳ Replying to</span>
              <span className="text-sm font-medium text-blue-800">{replyingTo.sender.name}</span>
            </div>
            <button
              onClick={onCancelReply}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-blue-700 truncate mt-1">{replyingTo.text}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <div className="flex items-end space-x-2">
          {/* Attachment Button */}
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled
            title="File attachments coming soon"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Input Field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sendingMessage}
              maxLength={2000}
            />

            {/* Emoji Button */}
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
              disabled
              title="Emoji picker coming soon"
            >
              <Smile className="h-4 w-4" />
            </button>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendingMessage}
            className={`p-2 rounded-lg transition-all ${
              input.trim() && !sendingMessage
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sendingMessage ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Message Hints */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift + Enter for new line</span>
          <span>{input.length}/2000</span>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
