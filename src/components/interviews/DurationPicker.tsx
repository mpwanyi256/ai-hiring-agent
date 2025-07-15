'use client';

import React, { useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface DurationPickerProps {
  value: number;
  onChange: (duration: number) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  options?: number[]; // duration options in minutes
}

const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  label,
  error,
  options = [15, 30, 45, 60, 90, 120],
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
  };

  const handleDurationSelect = (duration: number) => {
    onChange(duration);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 pr-10 border rounded-lg text-left focus:ring-2 focus:ring-primary focus:border-primary transition-colors',
            'bg-white text-gray-900',
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
            !disabled && 'hover:border-gray-400',
          )}
        >
          {value ? formatDuration(value) : 'Select duration'}
        </button>

        <ClockIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="py-1">
            {options.map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => handleDurationSelect(duration)}
                className={cn(
                  'w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                  value === duration && 'bg-primary text-white hover:bg-primary-light',
                )}
              >
                {formatDuration(duration)}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default DurationPicker;
