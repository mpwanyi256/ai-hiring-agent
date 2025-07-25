import React, { useState, useRef, useEffect } from 'react';
import { Smile, Search } from 'lucide-react';

const EMOJI_CATEGORIES = {
  Recent: ['😀', '😂', '👍', '❤️', '😊', '🎉', '🔥', '💯'],
  'Smileys & People': [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😝',
    '😜',
    '🤪',
    '🤨',
    '🧐',
    '🤓',
    '😎',
    '🤩',
    '🥳',
    '😏',
    '😒',
    '😞',
    '😔',
    '😟',
    '😕',
    '🙁',
    '☹️',
    '😣',
    '😖',
    '😫',
    '😩',
    '🥺',
    '😢',
    '😭',
    '😤',
    '😠',
    '😡',
    '🤬',
    '🤯',
    '😳',
    '🥵',
    '🥶',
    '😱',
    '😨',
    '😰',
    '😥',
    '😓',
    '🤗',
    '🤔',
    '🤭',
    '🤫',
    '🤥',
    '😶',
    '😐',
    '😑',
    '😬',
    '🙄',
    '😯',
    '😦',
    '😧',
    '😮',
    '😲',
    '🥱',
    '😴',
    '🤤',
    '😪',
    '😵',
    '🤐',
  ],
  Activities: [
    '⚽',
    '🏀',
    '🏈',
    '⚾',
    '🥎',
    '🎾',
    '🏐',
    '🏉',
    '🥏',
    '🎱',
    '🪀',
    '🏓',
    '🏸',
    '🏒',
    '🏑',
    '🥍',
    '🏏',
    '🪃',
    '🥅',
    '⛳',
    '🪁',
    '🏹',
    '🎣',
    '🤿',
    '🥊',
    '🥋',
    '🎽',
    '🛹',
    '🛼',
    '🛷',
    '⛸️',
    '🥌',
    '🎿',
    '⛷️',
    '🏂',
    '🪂',
    '🏋️‍♀️',
    '🏋️',
    '🏋️‍♂️',
    '🤼‍♀️',
    '🤼',
    '🤼‍♂️',
    '🤸‍♀️',
    '🤸',
    '🤸‍♂️',
    '⛹️‍♀️',
    '⛹️',
    '⛹️‍♂️',
  ],
  Objects: [
    '⌚',
    '📱',
    '📲',
    '💻',
    '⌨️',
    '🖥️',
    '🖨️',
    '🖱️',
    '🖲️',
    '🕹️',
    '💽',
    '💾',
    '💿',
    '📀',
    '📼',
    '📷',
    '📸',
    '📹',
    '🎥',
    '📽️',
    '🎞️',
    '📞',
    '☎️',
    '📟',
    '📠',
    '📺',
    '📻',
    '🎙️',
    '🎚️',
    '🎛️',
    '🧭',
    '⏱️',
    '⏲️',
    '⏰',
    '🕰️',
    '⌛',
    '⏳',
    '📡',
    '🔋',
    '🔌',
  ],
  Reactions: [
    '👍',
    '👎',
    '👌',
    '✌️',
    '🤞',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
    '👆',
    '🖕',
    '👇',
    '☝️',
    '👋',
    '🤚',
    '🖐️',
    '✋',
    '🖖',
    '👏',
    '🙌',
    '🤲',
    '🤝',
    '🙏',
    '✍️',
    '💪',
    '🦾',
    '🦿',
    '🦵',
    '🦶',
    '👂',
    '🦻',
    '👃',
    '🧠',
    '🫀',
    '🫁',
    '🦷',
    '🦴',
    '👀',
    '👁️',
    '👅',
    '👄',
    '💋',
    '🩸',
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
  ],
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
  trigger?: React.ReactNode;
  position?: 'top' | 'bottom' | 'auto';
  className?: string;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  onClose,
  isOpen,
  trigger,
  position = 'auto',
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState('Recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(
    typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('recentEmojis') || '[]') : [],
  );

  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        pickerRef.current &&
        triggerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);

    // Add to recent emojis
    const newRecent = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 8);
    setRecentEmojis(newRecent);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentEmojis', JSON.stringify(newRecent));
    }

    onClose();
  };

  // Filter emojis based on search
  const getFilteredEmojis = (category: string) => {
    let emojis =
      category === 'Recent'
        ? recentEmojis
        : EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES] || [];

    if (searchQuery) {
      // Simple search - you could enhance this with emoji names/keywords
      emojis = emojis.filter(
        (emoji) =>
          emoji.includes(searchQuery) ||
          getEmojiKeywords(emoji).some((keyword) =>
            keyword.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    return emojis;
  };

  // Basic emoji keywords for search
  const getEmojiKeywords = (emoji: string): string[] => {
    const keywords: Record<string, string[]> = {
      '😀': ['grin', 'smile', 'happy'],
      '😂': ['laugh', 'joy', 'tears', 'funny'],
      '👍': ['thumbs', 'up', 'like', 'good', 'yes'],
      '👎': ['thumbs', 'down', 'dislike', 'bad', 'no'],
      '❤️': ['heart', 'love', 'red'],
      '😊': ['blush', 'smile', 'happy'],
      '🎉': ['party', 'celebration', 'confetti'],
      '🔥': ['fire', 'hot', 'awesome'],
      '💯': ['hundred', 'perfect', 'score'],
    };
    return keywords[emoji] || [];
  };

  if (!isOpen) {
    return trigger ? (
      <div ref={triggerRef} className={className}>
        {trigger}
      </div>
    ) : null;
  }

  return (
    <>
      {trigger && (
        <div ref={triggerRef} className={className}>
          {trigger}
        </div>
      )}

      <div
        ref={pickerRef}
        className={`
          absolute z-50 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200
          ${position === 'top' ? 'bottom-full mb-2' : position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}
          ${className}
        `}
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emojis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`
                px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors
                ${
                  activeCategory === category
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-8 gap-1">
            {getFilteredEmojis(activeCategory).map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>

          {getFilteredEmojis(activeCategory).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Smile className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No emojis found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmojiPicker;
