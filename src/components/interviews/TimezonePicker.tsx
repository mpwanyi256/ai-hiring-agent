'use client';

import React, { useState, useMemo } from 'react';
import { GlobeAltIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Timezone } from '@/types/interviews';

interface TimezonePickerProps {
  value: string;
  onChange: (timezoneId: string) => void;
  timezones: Timezone[];
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  placeholder?: string;
}

const TimezonePicker: React.FC<TimezonePickerProps> = ({
  value,
  onChange,
  timezones,
  disabled = false,
  className,
  label,
  error,
  placeholder = 'Select timezone',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedTimezone = useMemo(() => {
    return timezones.find((tz) => tz.id === value);
  }, [timezones, value]);

  const filteredTimezones = useMemo(() => {
    if (!searchTerm) return timezones;

    const searchLower = searchTerm.toLowerCase();
    return timezones.filter(
      (timezone) =>
        timezone.displayName.toLowerCase().includes(searchLower) ||
        timezone.name.toLowerCase().includes(searchLower) ||
        timezone.country?.name.toLowerCase().includes(searchLower) ||
        timezone.city?.toLowerCase().includes(searchLower) ||
        timezone.region.toLowerCase().includes(searchLower),
    );
  }, [timezones, searchTerm]);

  const formatOffset = (hours: number, minutes: number) => {
    const sign = hours >= 0 ? '+' : '';
    const hourStr = Math.abs(hours).toString().padStart(2, '0');
    const minuteStr = minutes.toString().padStart(2, '0');
    return `${sign}${hourStr}:${minuteStr}`;
  };

  const handleTimezoneSelect = (timezoneId: string) => {
    onChange(timezoneId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const groupedTimezones = useMemo(() => {
    const groups: Record<string, Timezone[]> = {};

    filteredTimezones.forEach((timezone) => {
      const region = timezone.region;
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(timezone);
    });

    return groups;
  }, [filteredTimezones]);

  const sortedRegions = useMemo(() => {
    return Object.keys(groupedTimezones).sort((a, b) => {
      // Put Global first, then alphabetically
      if (a === 'Global') return -1;
      if (b === 'Global') return 1;
      return a.localeCompare(b);
    });
  }, [groupedTimezones]);

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
          {selectedTimezone ? (
            <div className="flex-col gap-1 items-center">
              <span className="font-medium text-sm">{selectedTimezone.displayName}</span>
              <span className="text-sm text-gray-500">
                ({formatOffset(selectedTimezone.offsetHours, selectedTimezone.offsetMinutes)})
              </span>
              {/* <GlobeAltIcon className="w-4 h-4 text-gray-400" /> */}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search timezones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Timezone List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredTimezones.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No timezones found matching &quot;{searchTerm}&quot;
              </div>
            ) : (
              <div>
                {sortedRegions.map((region) => (
                  <div key={region}>
                    <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {region}
                    </div>
                    {groupedTimezones[region].map((timezone) => (
                      <button
                        key={timezone.id}
                        type="button"
                        onClick={() => handleTimezoneSelect(timezone.id)}
                        className={cn(
                          'w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                          value === timezone.id && 'bg-primary text-white hover:bg-primary-light',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                'font-medium truncate',
                                value === timezone.id ? 'text-white' : 'text-gray-900',
                              )}
                            >
                              {timezone.displayName}
                            </div>
                            <div
                              className={cn(
                                'text-sm truncate',
                                value === timezone.id ? 'text-white/80' : 'text-gray-500',
                              )}
                            >
                              {timezone.city && timezone.country
                                ? `${timezone.city}, ${timezone.country.name}`
                                : timezone.country?.name || timezone.name}
                            </div>
                          </div>
                          <div
                            className={cn(
                              'text-sm font-mono ml-2',
                              value === timezone.id ? 'text-white/80' : 'text-gray-400',
                            )}
                          >
                            {formatOffset(timezone.offsetHours, timezone.offsetMinutes)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default TimezonePicker;
