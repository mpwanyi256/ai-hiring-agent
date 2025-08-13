'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface ComboboxWithCreateProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onCreateNew: (name: string) => Promise<void>;
  placeholder: string;
  label: string;
  loading?: boolean;
  error?: string;
  createLabel?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export default function ComboboxWithCreate({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder,
  label,
  loading = false,
  error,
  createLabel = 'Add new',
  className,
  onOpenChange,
}: ComboboxWithCreateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find((option) => option.id === value);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredOptions = options.filter((option) =>
    (open ? query : selectedOption?.name || '').trim() === ''
      ? true
      : option.name
          .toLowerCase()
          .includes((open ? query : selectedOption?.name || '').toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onOpenChange]);

  const close = () => {
    setOpen(false);
    onOpenChange?.(false);
  };

  const openDropdown = () => {
    setOpen(true);
    onOpenChange?.(true);
    setQuery(selectedOption?.name || '');
    // focus next tick
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      query.trim() &&
      !options.some((o) => o.name.toLowerCase() === query.toLowerCase())
    ) {
      e.preventDefault();
      if (!isCreating) {
        setIsCreating(true);
        try {
          await onCreateNew(query.trim());
          setQuery('');
          close();
        } catch (error) {
          console.error('Failed to create new item:', error);
        } finally {
          setIsCreating(false);
        }
      }
    } else if (e.key === 'Escape') {
      close();
    }
  };

  const handleCreateNew = async () => {
    if (!query.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await onCreateNew(query.trim());
      setQuery('');
      close();
    } catch (error) {
      console.error('Failed to create new item:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOptionSelect = (option: Option) => {
    onChange(option.id);
    setQuery('');
    close();
  };

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? query : selectedOption?.name || ''}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (!open) openDropdown();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
            error ? 'border-red-300' : ''
          }`}
          disabled={loading}
        />

        <button
          type="button"
          onClick={() => (open ? close() : openDropdown())}
          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
          disabled={loading}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
            ) : (
              <>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleOptionSelect(option)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {option.name}
                    </button>
                  ))
                ) : query.trim() ? (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    disabled={isCreating}
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center gap-2 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {isCreating ? 'Creating...' : `${createLabel} ${query}`}
                  </button>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {query.trim() &&
        !options.some((option) => option.name.toLowerCase() === query.toLowerCase()) &&
        open && (
          <div className="mt-1 text-xs text-gray-500">
            Press Enter or click to add <span className="font-medium">{query}</span> as a new{' '}
            {label.toLowerCase()}
          </div>
        )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
