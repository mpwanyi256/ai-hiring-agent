'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAnalytics } from '@/hooks/useAnalytics';

interface SearchAndFiltersProps {
  searchQuery: string;
  statusFilter: string;
  showFilters: boolean;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { value: '', label: 'All Jobs' },
  { value: 'draft', label: 'Draft' },
  { value: 'interviewing', label: 'Active' },
  { value: 'closed', label: 'Closed' },
];

export default function SearchAndFilters({
  searchQuery,
  statusFilter,
  showFilters,
  onSearchChange,
  onStatusFilterChange,
  onToggleFilters,
  onClearFilters,
}: SearchAndFiltersProps) {
  // Initialize analytics tracking
  const analytics = useAnalytics();

  const handleSearchChange = (query: string) => {
    onSearchChange(query);

    // Track search queries
    if (query.trim()) {
      analytics.trackSearch('jobs', query, 0); // Results count will be updated elsewhere
    }
  };

  const handleStatusFilterChange = (status: string) => {
    onStatusFilterChange(status);

    // Track filter applications
    if (status) {
      analytics.trackFilterApplied('job_status', status);
    }
  };

  const handleClearFilters = () => {
    onClearFilters();

    // Track filter clearing
    analytics.trackFilterCleared('all');
  };

  const hasActiveFilters = searchQuery || statusFilter;

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search jobs by title..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          className="flex items-center text-sm"
        >
          <FunnelIcon className="w-4 h-4 mr-2" />
          Filters
          {statusFilter && <span className="ml-2 w-2 h-2 bg-primary rounded-full"></span>}
        </Button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Status:</span>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusFilterChange(option.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    statusFilter === option.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {statusFilter && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <XMarkIcon className="w-3 h-3 mr-1" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
