import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Trash2, Copy, Reply } from 'lucide-react';
import { Message } from '@/types/messages';

interface MessageActionsProps {
  message: Message;
  onEdit: (messageId: string, newText: string) => void;
  onDelete: (messageId: string) => void;
  onReply: (message: Message) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  onEdit,
  onDelete,
  onReply,
  canEdit = false,
  canDelete = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.text);
    setShowMenu(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditText(message.text);
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText.trim() !== message.text) {
      onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text);
  };

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDelete(message.id);
    }
    setShowMenu(false);
  };

  const handleReplyClick = () => {
    onReply(message);
    setShowMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="w-full mt-2">
        <input
          ref={editInputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={2000}
        />
        <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
          <span>Press Enter to save, Esc to cancel</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
        title="Message options"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
          <button
            onClick={handleReplyClick}
            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Reply className="h-4 w-4" />
            <span>Reply</span>
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Copy className="h-4 w-4" />
            <span>Copy text</span>
          </button>

          {canEdit && !message.attachment && (
            <button
              onClick={handleStartEdit}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}

          {canDelete && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={handleDeleteClick}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageActions;
