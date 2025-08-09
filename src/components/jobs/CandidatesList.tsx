'use client';

import React, { useEffect, useState } from 'react';
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
  formatDate,
  pluralize,
} from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectCandidatesList,
  selectCandidatesLoading,
} from '@/store/candidates/candidatesSelectors';
import { setSelectedCandidate } from '@/store/selectedCandidate/selectedCandidateSlice';
import { fetchJobCandidates } from '@/store/candidates/candidatesThunks';
import { selectCurrentJob } from '@/store/jobs/jobsSelectors';
import { fetchSelectedCandidateDetails } from '@/store/selectedCandidate/selectedCandidateThunks';

interface CandidatesListProps {
  selectedCandidateId?: string;
  onCandidateSelect: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const statusOptions = getCandidateStatusOptions();

export default function CandidatesList({
  selectedCandidateId,
  searchQuery,
  onSearchChange,
}: CandidatesListProps) {
  const candidates = useAppSelector(selectCandidatesList);
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectCandidatesLoading);
  const currentJob = useAppSelector(selectCurrentJob);
  const [filters, setFilters] = useState({
    minScore: '',
    maxScore: '',
    startDate: '',
    endDate: '',
    candidateStatus: '' as CandidateStatus | '',
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  const selected = useAppSelector((s) => s.selectedCandidate.candidate);
  const selectedLoading = useAppSelector((s) => s.selectedCandidate.isLoading);
  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false);
  const [pendingResumeCandidateId, setPendingResumeCandidateId] = useState<string | null>(null);

  const handleFilterChange = (key: string, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
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
  };

  const handleCandidateSelect = (candidate: Candidate) => {
    dispatch(setSelectedCandidate(candidate));
    dispatch(fetchSelectedCandidateDetails(candidate.id));
  };

  const handlePreviewResume = (candidate: Candidate) => {
    if (selected?.id === candidate.id && selected?.resume?.publicUrl) {
      setIsResumePreviewOpen(true);
      return;
    }
    dispatch(setSelectedCandidate(candidate));
    dispatch(fetchSelectedCandidateDetails(candidate.id));
    setPendingResumeCandidateId(candidate.id);
  };

  useEffect(() => {
    if (
      pendingResumeCandidateId &&
      selected?.id === pendingResumeCandidateId &&
      selected?.resume?.publicUrl &&
      !selectedLoading
    ) {
      setIsResumePreviewOpen(true);
      setPendingResumeCandidateId(null);
    }
  }, [pendingResumeCandidateId, selected?.id, selected?.resume?.publicUrl, selectedLoading]);

  useEffect(() => {
    if (currentJob?.id) {
      dispatch(
        fetchJobCandidates({
          jobId: currentJob.id,
          search: searchQuery,
          minScore: filters.minScore ? parseInt(filters.minScore) : undefined,
          maxScore: filters.maxScore ? parseInt(filters.maxScore) : undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          candidateStatus: filters.candidateStatus || undefined,
          sortBy: filters.sortBy || undefined,
          sortOrder: filters.sortOrder || undefined,
        }),
      );
    }

    return () => {
      dispatch(setSelectedCandidate(null));
    };
  }, [dispatch, currentJob?.id, searchQuery, filters]);

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
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            {!candidates.length
              ? 'No candidates found'
              : `${candidates.length} ${pluralize(candidates.length, 'Candidate')}`}
          </h3>
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

                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    {/* Name and Email */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {candidate.name}
                      </h4>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(
                          candidate?.evaluation?.score || 0,
                        )}`}
                      >
                        {candidate.evaluation?.score || 0}%
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 truncate">{candidate.email}</p>

                    {/* Progress and Status */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewResume(candidate);
                          }}
                          className="text-[11px] px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          Resume
                        </button>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resume Preview Modal */}
      {isResumePreviewOpen && selected?.resume?.publicUrl && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="text-sm font-medium">Resume Preview</div>
              <div className="flex items-center gap-2">
                <a
                  href={selected.resume.publicUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setIsResumePreviewOpen(false)}
                  className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                  aria-label="Close"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1">
              <iframe
                src={selected.resume.publicUrl}
                className="w-full h-full"
                title="Candidate Resume"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
