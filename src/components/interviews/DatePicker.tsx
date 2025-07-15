'use client';

import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
  error?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  className,
  placeholder = 'Select date',
  label,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
    setIsOpen(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={cn('relative', className)}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={handleDateChange}
          min={minDate}
          max={maxDate}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors',
            'bg-white text-gray-900 placeholder-gray-500',
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
          )}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />

        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {value && <div className="mt-1 text-sm text-gray-600">{formatDisplayDate(value)}</div>}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default DatePicker;
