import React, { useState, useRef } from 'react';
import { Send, Smile, Loader2 } from 'lucide-react';
import { Message } from '@/hooks/useMessages';
import FileUpload from './FileUpload';

interface MessageInputProps {
  onSendMessage: (text: string, replyToId?: string, attachment?: File) => Promise<void>;
  sendingMessage: boolean;
  replyingTo: Message | null;
  onCancelReply: () => void;
  placeholder?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  sendingMessage,
  replyingTo,
  onCancelReply,
  placeholder = 'Type your message...',
  onTypingStart,
  onTypingStop,
}) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || sendingMessage) return;

    try {
      await onSendMessage(input, replyingTo?.id, selectedFile || undefined);
      setInput('');
      setSelectedFile(null);
      onCancelReply();
      handleTypingStop();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 2000);
  };

  const handleTypingStop = () => {
    setIsTyping(false);
    onTypingStop?.();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (e.target.value.length > 0) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      if (replyingTo) {
        onCancelReply();
      } else if (selectedFile) {
        setSelectedFile(null);
      }
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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
              title="Cancel reply (Esc)"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-blue-700 truncate mt-1">{replyingTo.text}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        {/* File Preview */}
        {selectedFile && (
          <FileUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={selectedFile}
            disabled={sendingMessage}
          />
        )}

        <div className="flex items-end space-x-2">
          {/* File Upload Button */}
          <FileUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={null}
            disabled={sendingMessage}
          />

          {/* Input Field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
              placeholder={selectedFile ? 'Add a caption...' : placeholder}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleTypingStop}
              disabled={sendingMessage}
              maxLength={2000}
            />

            {/* Emoji Button */}
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
              disabled
              title="Emoji picker (coming soon)"
            >
              <Smile className="h-4 w-4" />
            </button>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedFile) || sendingMessage}
            className={`p-2 rounded-lg transition-all ${
              (input.trim() || selectedFile) && !sendingMessage
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={`Send message${selectedFile ? ' with attachment' : ''} (Enter)`}
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
          <div className="flex items-center space-x-4">
            <span>Press Enter to send, Esc to cancel</span>
            {selectedFile && <span className="text-blue-600">📎 File attached</span>}
          </div>
          <span>{input.length}/2000</span>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
