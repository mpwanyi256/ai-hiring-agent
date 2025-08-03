'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';

interface Option {
  id: string;
  name: string;
  category?: string;
}

interface MultiSelectWithCreateProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  onCreateNew: (name: string) => Promise<void>;
  placeholder: string;
  label: string;
  loading?: boolean;
  error?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  dropdownOpen: boolean;
  onDropdownToggle: (open: boolean) => void;
  dataDropdown: string;
  createLabel?: string;
}

export default function MultiSelectWithCreate({
  options,
  selectedValues,
  onChange,
  onCreateNew,
  placeholder,
  label,
  loading = false,
  error,
  searchValue,
  onSearchChange,
  dropdownOpen,
  onDropdownToggle,
  dataDropdown,
  createLabel = 'Add new',
}: MultiSelectWithCreateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);

  const selectedOptions = options.filter((option) => selectedValues.includes(option.id));
  const filteredOptions = options.filter(
    (option) =>
      option.name.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selectedValues.includes(option.id),
  );

  // Handle keyboard navigation
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      searchValue.trim() &&
      !filteredOptions.some((option) => option.name.toLowerCase() === searchValue.toLowerCase())
    ) {
      e.preventDefault();
      if (!isCreating) {
        setIsCreating(true);
        try {
          await onCreateNew(searchValue.trim());
          onSearchChange('');
        } catch (error) {
          console.error('Failed to create new item:', error);
        } finally {
          setIsCreating(false);
        }
      }
    } else if (e.key === 'Escape') {
      onDropdownToggle(false);
    } else if (e.key === 'Backspace' && !searchValue && selectedValues.length > 0) {
      // Remove last selected item when backspace is pressed on empty input
      const newValues = [...selectedValues];
      newValues.pop();
      onChange(newValues);
    }
  };

  const handleCreateNew = async () => {
    if (!searchValue.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await onCreateNew(searchValue.trim());
      onSearchChange('');
    } catch (error) {
      console.error('Failed to create new item:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOptionSelect = (option: Option) => {
    if (!selectedValues.includes(option.id)) {
      onChange([...selectedValues, option.id]);
    }
    onSearchChange('');
    inputRef.current?.focus();
  };

  const handleRemoveOption = (optionId: string) => {
    onChange(selectedValues.filter((id) => id !== optionId));
  };

  return (
    <div className="relative" data-dropdown={dataDropdown}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      <div className="relative">
        <div
          className={`min-h-[40px] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus-within:outline-none focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 ${
            error ? 'border-red-300' : ''
          } ${dropdownOpen ? 'ring-1 ring-blue-500 border-blue-500' : ''}`}
          onClick={() => {
            inputRef.current?.focus();
            if (!dropdownOpen) onDropdownToggle(true);
          }}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selectedOptions.map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
              >
                {option.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveOption(option.id);
                  }}
                  className="hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => {
                if (!dropdownOpen) onDropdownToggle(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={selectedValues.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] border-none outline-none bg-transparent"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDropdownToggle(!dropdownOpen)}
          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
          disabled={loading}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dropdownOpen && (
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
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex flex-col"
                    >
                      <span>{option.name}</span>
                      {option.category && (
                        <span className="text-xs text-gray-500">{option.category}</span>
                      )}
                    </button>
                  ))
                ) : searchValue.trim() ? (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    disabled={isCreating}
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center gap-2 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {isCreating ? 'Creating...' : `${createLabel} ${searchValue}`}
                  </button>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {searchValue.trim() &&
        !filteredOptions.some(
          (option) => option.name.toLowerCase() === searchValue.toLowerCase(),
        ) &&
        dropdownOpen && (
          <div className="mt-1 text-xs text-gray-500">
            Press Enter or click to add <span className="font-medium">{searchValue}</span> as a new{' '}
            {label.toLowerCase()}
          </div>
        )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
