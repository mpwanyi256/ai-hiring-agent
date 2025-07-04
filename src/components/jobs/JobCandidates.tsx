'use client';

import React, { useState, useEffect } from 'react';
import CandidatesOverview from './CandidatesOverview';
import CandidatesList from './CandidatesList';
import { CurrentJob } from '@/types/jobs';
import { 
  UserCircleIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface JobCandidatesProps {
  job: CurrentJob;
}

// Mock candidate data - this will be replaced with real data in step 3
const mockCandidates = [
  {
    id: '1',
    name: 'Samuel Mpwanyi',
    email: 'samuelmmpwanyi@gmail.com',
    progress: 33,
    responses: 5,
    score: 85,
    status: 'in_progress' as const,
    createdAt: '2025-07-03T00:00:00Z'
  },
  {
    id: '2',
    name: 'Michael Alexandro',
    email: 'michael.alex@email.com',
    progress: 100,
    responses: 8,
    score: 92,
    status: 'completed' as const,
    createdAt: '2025-02-09T00:00:00Z'
  },
  {
    id: '3',
    name: 'Darrell Steward',
    email: 'darrell.s@email.com',
    progress: 75,
    responses: 6,
    score: 78,
    status: 'in_progress' as const,
    createdAt: '2025-02-12T00:00:00Z'
  }
];

export default function JobCandidates({ job }: JobCandidatesProps) {
  const [candidates, setCandidates] = useState(mockCandidates);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate metrics
  const totalCandidates = candidates.length;
  const inProgress = candidates.filter(c => c.status === 'in_progress').length;
  const completed = candidates.filter(c => c.status === 'completed').length;
  const averageScore = candidates.length > 0 
    ? Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length)
    : 0;

  // Filter candidates based on search
  const filteredCandidates = candidates.filter(candidate =>
    candidate.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCandidate = selectedCandidateId 
    ? candidates.find(c => c.id === selectedCandidateId)
    : null;

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <CandidatesOverview
        totalCandidates={totalCandidates}
        inProgress={inProgress}
        completed={completed}
        averageScore={averageScore}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Candidates List */}
        <div className="lg:col-span-4">
          <CandidatesList
            candidates={filteredCandidates}
            selectedCandidateId={selectedCandidateId}
            onCandidateSelect={setSelectedCandidateId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Candidate Details */}
        <div className="lg:col-span-8">
          {selectedCandidate ? (
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              {/* Header with gradient background like in reference */}
              <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 rounded-lg p-6 mb-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20"></div>
                <div className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {selectedCandidate.name?.charAt(0).toUpperCase() || selectedCandidate.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedCandidate.name || 'Anonymous Candidate'}</h2>
                      <p className="text-blue-100">{selectedCandidate.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-4">
                    <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Move Draft
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Schedule Interview
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserCircleIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Applied For</span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">{job.title}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Application Date</span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">
                    {new Date(selectedCandidate.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ChartBarIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Experience</span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">
                    {job.fields?.experienceLevel?.replace(/([A-Z])/g, ' $1').trim() || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Evaluation Summary */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Combined Evaluation</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Resume score {selectedCandidate.score}/100, Interview completion with {selectedCandidate.responses} responses. 
                  Overall assessment: {selectedCandidate.score}/100.
                </p>
                
                {/* Evaluation highlights */}
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-800">
                      Strong experience with both frontend and backend technologies.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-800">
                      Proven ability to enhance user experience through innovative solutions.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-800">
                      Collaborative approach demonstrated through teamwork and code reviews.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    View Details
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    View Evaluation
                  </button>
                </div>
              </div>

              {/* File Attachments */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">File Attachment</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-sm text-gray-900">michael-cv-updated</span>
                    <span className="text-xs text-gray-500">File PDF • 2.1 MB</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-sm text-gray-900">michael-portfolio-new</span>
                    <span className="text-xs text-gray-500">File PDF • 1.8 MB</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
              <div className="text-gray-400 mb-4">
                <UserCircleIcon className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a candidate</h3>
              <p className="text-sm text-gray-500">
                Choose a candidate from the list to view their detailed evaluation and responses
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 