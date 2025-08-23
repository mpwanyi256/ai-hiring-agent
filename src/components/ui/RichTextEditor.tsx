'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useImperativeHandle, forwardRef } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export interface RichTextEditorRef {
  insertAtCursor: (text: string) => void;
  focus: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    { content, onChange, placeholder = 'Start typing...', className = '', disabled = false },
    ref,
  ) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-primary underline hover:text-primary-light',
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        BulletList.configure({
          HTMLAttributes: {
            class: 'list-disc ml-6',
          },
        }),
        OrderedList.configure({
          HTMLAttributes: {
            class: 'list-decimal ml-6',
          },
        }),
        ListItem,
      ],
      content,
      onUpdate: ({ editor }) => {
        if (!disabled) {
          onChange(editor.getHTML());
        }
      },
      editable: !disabled,
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3',
        },
      },
    });

    // Expose methods through ref
    useImperativeHandle(
      ref,
      () => ({
        insertAtCursor: (text: string) => {
          if (editor && !disabled) {
            editor
              .chain()
              .focus()
              .insertContent(text + ' ')
              .run();
          }
        },
        focus: () => {
          if (editor && !disabled) {
            editor.chain().focus().run();
          }
        },
      }),
      [editor, disabled],
    );

    // Update editor content when content prop changes (fixes template loading)
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }, [editor, content]);

    if (!editor) {
      return null;
    }

    const addLink = () => {
      if (disabled) return;

      const url = prompt('Enter URL:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    };

    return (
      <div className={`border border-gray-light rounded-lg overflow-hidden ${className}`}>
        {/* Toolbar */}
        <div className="flex items-center space-x-1 p-2 border-b border-gray-light bg-gray-50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            className={`p-2 rounded transition-colors ${
              disabled
                ? 'text-gray-400 cursor-not-allowed'
                : editor.isActive('bold')
                  ? 'bg-gray-200 text-primary hover:bg-gray-200'
                  : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Bold"
          >
            <BoldIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            className={`p-2 rounded transition-colors ${
              disabled
                ? 'text-gray-400 cursor-not-allowed'
                : editor.isActive('italic')
                  ? 'bg-gray-200 text-primary hover:bg-gray-200'
                  : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Italic"
          >
            <ItalicIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={disabled}
            className={`p-2 rounded transition-colors ${
              disabled
                ? 'text-gray-400 cursor-not-allowed'
                : editor.isActive('strike')
                  ? 'bg-gray-200 text-primary hover:bg-gray-200'
                  : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Strikethrough"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            className={`p-2 rounded transition-colors ${
              disabled
                ? 'text-gray-400 cursor-not-allowed'
                : editor.isActive('bulletList')
                  ? 'bg-gray-200 text-primary hover:bg-gray-200'
                  : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Bullet List"
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            className={`p-2 rounded transition-colors ${
              disabled
                ? 'text-gray-400 cursor-not-allowed'
                : editor.isActive('orderedList')
                  ? 'bg-gray-200 text-primary hover:bg-gray-200'
                  : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Numbered List"
          >
            <NumberedListIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={addLink}
            disabled={disabled}
            className={`p-2 rounded transition-colors ${
              disabled
                ? 'text-gray-400 cursor-not-allowed'
                : editor.isActive('link')
                  ? 'bg-gray-200 text-primary hover:bg-gray-200'
                  : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={disabled}
            className={`p-2 rounded transition-colors ${
              disabled
                ? 'text-gray-400 cursor-not-allowed'
                : editor.isActive('blockquote')
                  ? 'bg-gray-200 text-primary hover:bg-gray-200'
                  : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Quote"
          >
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <select
            onChange={(e) => {
              const level = parseInt(e.target.value);
              if (level === 0) {
                editor.chain().focus().setParagraph().run();
              } else {
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: level as 1 | 2 | 3 })
                  .run();
              }
            }}
            disabled={disabled}
            className={`text-sm border-0 bg-transparent focus:outline-none ${
              disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600'
            }`}
            value={
              editor.isActive('heading', { level: 1 })
                ? 1
                : editor.isActive('heading', { level: 2 })
                  ? 2
                  : editor.isActive('heading', { level: 3 })
                    ? 3
                    : 0
            }
          >
            <option value={0}>Normal</option>
            <option value={1}>Heading 1</option>
            <option value={2}>Heading 2</option>
            <option value={3}>Heading 3</option>
          </select>
        </div>

        {/* Editor Content */}
        <div className="min-h-[120px] max-h-96 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  },
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
