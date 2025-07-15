'use client';

import React, { useState, useMemo } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  minTime?: string;
  maxTime?: string;
  interval?: number; // minutes between time slots
  availableSlots?: string[]; // specific available time slots
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  label,
  error,
  minTime = '09:00',
  maxTime = '17:00',
  interval = 30,
  availableSlots,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const [minHour, minMinute] = minTime.split(':').map(Number);
    const [maxHour, maxMinute] = maxTime.split(':').map(Number);

    let currentHour = minHour;
    let currentMinute = minMinute;

    while (currentHour < maxHour || (currentHour === maxHour && currentMinute <= maxMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      // If availableSlots is provided, only include those slots
      if (availableSlots) {
        if (availableSlots.includes(timeString)) {
          slots.push(timeString);
        }
      } else {
        slots.push(timeString);
      }

      currentMinute += interval;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    return slots;
  }, [minTime, maxTime, interval, availableSlots]);

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const handleTimeSelect = (time: string) => {
    onChange(time);
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
          {value ? formatTime(value) : 'Select time'}
        </button>

        <ClockIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="py-1">
            {timeSlots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => handleTimeSelect(time)}
                className={cn(
                  'w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                  value === time && 'bg-primary text-white hover:bg-primary-light',
                )}
              >
                {formatTime(time)}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default TimePicker;
