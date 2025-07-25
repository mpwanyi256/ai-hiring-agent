import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, X, Bold, Italic, Link, Reply } from 'lucide-react';
import { Message } from '@/types/messages';
import FileUpload from './FileUpload';
import EmojiPicker from './EmojiPicker';

interface MessageInputProps {
  onSendMessage: (text: string, replyToId?: string, attachment?: File) => Promise<void>;
  sendingMessage: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  sendingMessage,
  replyingTo,
  onCancelReply,
  onTypingStart,
  onTypingStop,
  placeholder = 'Type your message...',
}) => {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Handle typing indicators
  const handleInputChange = (value: string) => {
    setMessage(value);

    // Trigger typing start
    if (value && onTypingStart) {
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing (increased from 2 to 5 seconds)
    typingTimeoutRef.current = setTimeout(() => {
      if (onTypingStop) {
        onTypingStop();
      }
    }, 5000);
  };

  // Stop typing when component unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (onTypingStop) {
        onTypingStop();
      }
    };
  }, [onTypingStop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!message.trim() && !attachment) || sendingMessage) {
      return;
    }

    const messageText = message.trim();
    const currentAttachment = attachment;
    const replyToId = replyingTo?.id;

    // Clear form
    setMessage('');
    setAttachment(null);
    setShowFileUpload(false);

    // Stop typing indicator
    if (onTypingStop) {
      onTypingStop();
    }

    try {
      await onSendMessage(messageText, replyToId, currentAttachment || undefined);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      if (replyingTo && onCancelReply) {
        onCancelReply();
      } else if (showEmojiPicker) {
        setShowEmojiPicker(false);
      } else if (showFileUpload) {
        setShowFileUpload(false);
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newText);

      // Restore cursor position after emoji
      setTimeout(() => {
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        textarea.focus();
      }, 0);
    } else {
      setMessage((prev) => prev + emoji);
    }
  };

  const insertFormatting = (before: string, after?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.slice(start, end);
    const afterText = after || before;

    let newText: string;
    let newCursorPos: number;

    if (selectedText) {
      // Wrap selected text
      newText = message.slice(0, start) + before + selectedText + afterText + message.slice(end);
      newCursorPos = start + before.length + selectedText.length + afterText.length;
    } else {
      // Insert formatting markers
      newText = message.slice(0, start) + before + afterText + message.slice(end);
      newCursorPos = start + before.length;
    }

    setMessage(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const handleFileSelect = (file: File) => {
    setAttachment(file);
    setShowFileUpload(false);
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const canSend = (message.trim() || attachment) && !sendingMessage;

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 min-w-0">
              <Reply className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-600">
                  Replying to {replyingTo.sender.name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {replyingTo.text || (replyingTo.attachment ? 'Sent an attachment' : 'Message')}
                </p>
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              type="button"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Attachment Preview */}
      {attachment && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Paperclip className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-700 truncate">{attachment.name}</span>
              <span className="text-xs text-blue-500">
                ({(attachment.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            </div>
            <button
              onClick={removeAttachment}
              className="p-1 hover:bg-blue-200 rounded transition-colors"
              type="button"
            >
              <X className="h-4 w-4 text-blue-500" />
            </button>
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <form onSubmit={handleSubmit} ref={formRef} className="relative">
        {/* Formatting Toolbar (Above Input) */}
        <div className="hidden lg:flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertFormatting('**')}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Bold"
            >
              <Bold className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*')}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Italic"
            >
              <Italic className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('[Link text](', ')')}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Link"
            >
              <Link className="h-3 w-3" />
            </button>
          </div>
          <span className="text-xs text-gray-400">Use Shift+Enter for new line</span>
        </div>

        <div className="flex items-center gap-2 md:gap-3 px-3 py-3">
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              rows={1}
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2.5 pr-16 md:pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400"
              style={{ minHeight: '40px', maxHeight: '80px' }}
              disabled={sendingMessage}
            />

            {/* Input Action Buttons */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5">
              {/* Emoji Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Add emoji"
                >
                  <Smile className="h-3.5 w-3.5" />
                </button>

                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onEmojiSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                  position="top"
                />
              </div>

              {/* File Upload */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </button>

                {showFileUpload && (
                  <div className="absolute bottom-full right-0 mb-2 z-10">
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      onClose={() => setShowFileUpload(false)}
                      accept="image/*,.pdf,.doc,.docx,.txt,.csv"
                      maxSize={10 * 1024 * 1024} // 10MB
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send Button */}
          <div className="flex-shrink-0">
            <button
              type="submit"
              disabled={!canSend}
              className={`
                w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center
                ${
                  canSend
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
                ${sendingMessage ? 'animate-pulse' : ''}
              `}
              title={canSend ? 'Send message' : 'Type a message or attach a file'}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Helper Text (Mobile) */}
        <div className="lg:hidden px-4 pb-2">
          <p className="text-xs text-gray-500">Press Enter to send • Shift+Enter for new line</p>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
