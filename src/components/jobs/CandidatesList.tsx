'use client';

import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  ClockIcon,
  CalendarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Candidate, CandidateStatus } from '@/types/candidates';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  getCandidateStatusLabelStyle,
  getCandidateStatusOptions,
  getScoreColor,
} from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectCandidatesLoading } from '@/store/candidates/candidatesSelectors';
import { setSelectedCandidate } from '@/store/selectedCandidate/selectedCandidateSlice';

interface CandidatesListProps {
  candidates: Candidate[];
  selectedCandidateId?: string;
  onCandidateSelect: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFiltersChange?: (filters: {
    minScore?: number;
    maxScore?: number;
    startDate?: string;
    endDate?: string;
    candidateStatus?: CandidateStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => void;
}

const statusOptions = getCandidateStatusOptions();

export default function CandidatesList({
  candidates,
  selectedCandidateId,
  searchQuery,
  onSearchChange,
  onFiltersChange,
}: CandidatesListProps) {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectCandidatesLoading);
  const [filters, setFilters] = useState({
    minScore: '',
    maxScore: '',
    startDate: '',
    endDate: '',
    candidateStatus: '' as CandidateStatus | '',
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'pending':
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const handleFilterChange = (key: string, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    if (onFiltersChange) {
      onFiltersChange({
        minScore: newFilters.minScore ? parseInt(newFilters.minScore) : undefined,
        maxScore: newFilters.maxScore ? parseInt(newFilters.maxScore) : undefined,
        startDate: newFilters.startDate || undefined,
        endDate: newFilters.endDate || undefined,
        candidateStatus: newFilters.candidateStatus as CandidateStatus | undefined,
        sortBy: newFilters.sortBy,
        sortOrder: newFilters.sortOrder,
      });
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      minScore: '',
      maxScore: '',
      startDate: '',
      endDate: '',
      candidateStatus: '' as CandidateStatus | '',
      sortBy: 'created_at',
      sortOrder: 'desc' as 'asc' | 'desc',
    };
    setFilters(clearedFilters);

    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  const handleCandidateSelect = (candidate: Candidate) => {
    dispatch(setSelectedCandidate(candidate));
  };

  const hasActiveFilters =
    filters.minScore ||
    filters.maxScore ||
    filters.startDate ||
    filters.endDate ||
    filters.candidateStatus;

  return (
    <div className="bg-white rounded-lg border border-gray-100 h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Candidates ({candidates.length})</h3>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`flex items-center space-x-1 text-sm transition-colors ${
                  hasActiveFilters ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="Open filters"
              >
                <FunnelIcon className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters && <span className="w-2 h-2 bg-primary rounded-full"></span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <div className="flex flex-col gap-4">
                {/* Status Filter (shadcn/ui Select) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <Select
                    value={filters.candidateStatus}
                    onValueChange={(value) => handleFilterChange('candidateStatus', value)}
                  >
                    <SelectTrigger className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Sort Options */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                  <div className="flex gap-2">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => handleFilterChange('sortBy', value)}
                    >
                      <SelectTrigger className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Date Applied</SelectItem>
                        <SelectItem value="score">Score</SelectItem>
                        <SelectItem value="full_name">Name</SelectItem>
                        <SelectItem value="candidate_status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.sortOrder}
                      onValueChange={(value) =>
                        handleFilterChange('sortOrder', value as 'asc' | 'desc')
                      }
                    >
                      <SelectTrigger className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Desc</SelectItem>
                        <SelectItem value="asc">Asc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="w-3 h-3" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        {/* Search */}
        <div className="relative mt-2">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidates"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>
      {/* Candidates List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {isLoading || candidates.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <ChartBarIcon className="w-12 h-12 mx-auto" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              {isLoading ? 'Loading...' : 'No candidates yet'}
            </h4>
            {!isLoading && (
              <p className="text-xs text-gray-500">
                Candidates will appear here once they complete the interview
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => handleCandidateSelect(candidate)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedCandidateId === candidate.id ? 'bg-blue-50 border-r-2 border-primary' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {candidate.name
                        ? candidate.name.charAt(0).toUpperCase()
                        : candidate.email.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name and Email */}
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {candidate.name || 'Anonymous Candidate'}
                      </h4>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(candidate?.evaluation?.score || 0)}`}
                      >
                        {candidate.evaluation?.score || 0}/100
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 truncate mb-2">{candidate.email}</p>

                    {/* Progress and Status */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <ChartBarIcon className="w-3 h-3" />
                        <span>Progress: {candidate.progress}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>{candidate.evaluation?.resumeScore} score</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>{formatDate(candidate.createdAt)}</span>
                      </div>
                    </div>

                    {/* Status and Evaluation Summary */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs font-medium ${getStatusColor(candidate.status)}`}>
                        {getStatusLabel(candidate.status)}
                      </span>
                      {candidate.candidateStatus && (
                        <span
                          className={`text-xs text-gray-500 px-2 py-1 rounded-full ${getCandidateStatusLabelStyle(
                            candidate.candidateStatus,
                          )}`}
                        >
                          {candidate.candidateStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
