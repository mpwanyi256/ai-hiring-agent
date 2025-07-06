'use client';

import React from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface Candidate {
  id: string;
  name?: string;
  email: string;
  progress: number;
  responses: number;
  score: number;
  status: 'in_progress' | 'completed' | 'pending';
  createdAt: string;
  profileImage?: string;
  resumeScore: number;
}

interface CandidatesListProps {
  candidates: Candidate[];
  selectedCandidateId?: string;
  onCandidateSelect: (candidateId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function CandidatesList({
  candidates,
  selectedCandidateId,
  onCandidateSelect,
  searchQuery,
  onSearchChange
}: CandidatesListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Candidates ({candidates.length})
          </h3>
          <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Sort options */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>Select All</span>
          <select className="border border-gray-200 rounded px-2 py-1 text-xs">
            <option>Sort By</option>
            <option>Score (High to Low)</option>
            <option>Score (Low to High)</option>
            <option>Date Applied</option>
            <option>Name</option>
          </select>
        </div>
      </div>

      {/* Candidates List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {candidates.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <ChartBarIcon className="w-12 h-12 mx-auto" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">No candidates yet</h4>
            <p className="text-xs text-gray-500">Candidates will appear here once they complete the interview</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => onCandidateSelect(candidate.id)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedCandidateId === candidate.id ? 'bg-blue-50 border-r-2 border-primary' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {candidate.name ? candidate.name.charAt(0).toUpperCase() : candidate.email.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name and Email */}
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {candidate.name || 'Anonymous Candidate'}
                      </h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(candidate.score)}`}>
                        {candidate.score}/100
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
                        <span>{candidate.resumeScore} score</span>
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
                      {candidate.status === 'completed' && (
                        <span className="text-xs text-gray-500">
                          {candidate.status === 'completed' ? 'Ready for review' : 'Interview in progress'}
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