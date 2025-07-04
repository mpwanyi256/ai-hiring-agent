'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CandidatesOverview from './CandidatesOverview';
import CandidatesList from './CandidatesList';
import { CurrentJob } from '@/types/jobs';
import { AppDispatch, RootState } from '@/store';
import { fetchJobCandidates } from '@/store/candidates/candidatesThunks';
import { 
  UserCircleIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface JobCandidatesProps {
  job: CurrentJob;
}

export default function JobCandidates({ job }: JobCandidatesProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    candidates, 
    jobCandidatesStats, 
    isLoading, 
    error,
    pagination 
  } = useSelector((state: RootState) => state.candidates);
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch candidates when component mounts or job changes
  useEffect(() => {
    if (job.id) {
      dispatch(fetchJobCandidates({ jobId: job.id }));
    }
  }, [dispatch, job.id]);

  // Filter candidates based on search
  const filteredCandidates = candidates.filter(candidate => {
    const candidateName = (candidate as any).name || (candidate as any).fullName || '';
    const candidateEmail = candidate.email || '';
    return candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           candidateEmail.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedCandidate = selectedCandidateId 
    ? candidates.find(c => c.id === selectedCandidateId)
    : null;

  // Transform data for components
  const overviewData = {
    totalCandidates: jobCandidatesStats.total,
    inProgress: jobCandidatesStats.inProgress,
    completed: jobCandidatesStats.completed,
    averageScore: jobCandidatesStats.averageScore
  };

  // Transform candidates for the list component
  const transformedCandidates = filteredCandidates.map(candidate => {
    const candidateAny = candidate as any;
    return {
      id: candidate.id,
      name: candidateAny.name || candidateAny.fullName || undefined,
      email: candidate.email || '',
      progress: candidateAny.progress || candidateAny.completionPercentage || 0,
      responses: candidateAny.responses || candidateAny.responseCount || 0,
      score: candidate.evaluation?.score || 0,
      status: (candidateAny.isCompleted ? 'completed' : 'in_progress') as 'in_progress' | 'completed' | 'pending',
      createdAt: candidateAny.createdAt || new Date().toISOString()
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CandidatesOverview {...overviewData} />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading candidates...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <CandidatesOverview {...overviewData} />
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <CandidatesOverview {...overviewData} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-24rem)]">
        {/* Candidates List - Fixed height with internal scroll */}
        <div className="lg:col-span-4 h-full">
          <CandidatesList
            candidates={transformedCandidates}
            selectedCandidateId={selectedCandidateId}
            onCandidateSelect={setSelectedCandidateId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Candidate Details - Fixed height with internal scroll */}
        <div className="lg:col-span-8 h-full">
          {selectedCandidate ? (
            <div className="bg-white rounded-lg border border-gray-100 h-full flex flex-col">
              {/* Header with gradient background - using app theme colors */}
              <div className="bg-gradient-to-r from-primary via-green-600 to-primary rounded-t-lg p-6 text-white relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-green-500/20"></div>
                <div className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {((selectedCandidate as any).name || (selectedCandidate as any).fullName)?.charAt(0).toUpperCase() || 
                         selectedCandidate.email?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {(selectedCandidate as any).name || (selectedCandidate as any).fullName || 'Anonymous Candidate'}
                      </h2>
                      <p className="text-green-100">{selectedCandidate.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-4">
                    <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Move Draft
                    </button>
                    <button className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Schedule Interview
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Candidate Info Grid - using app theme colors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <UserCircleIcon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-gray-700">Applied For</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">{job.title}</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Application Date</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">
                      {new Date((selectedCandidate as any).createdAt || new Date()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <ChartBarIcon className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Experience</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">
                      {job.fields?.experienceLevel?.replace(/([A-Z])/g, ' $1').trim() || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Evaluation Summary */}
                {selectedCandidate.evaluation ? (
                  <div className="border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Combined Evaluation</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Interview score {selectedCandidate.evaluation.score}/100, Interview completion with{' '}
                      {selectedCandidate.responses?.length || (selectedCandidate as any).responseCount || 0} responses. 
                      Overall assessment: {selectedCandidate.evaluation.score}/100.
                    </p>
                    
                    {/* Evaluation highlights */}
                    <div className="space-y-2">
                      {selectedCandidate.evaluation.strengths?.map((strength, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-sm text-green-800">{strength}</p>
                        </div>
                      ))}
                      
                      {selectedCandidate.evaluation.redFlags?.map((redFlag, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-sm text-red-800">{redFlag}</p>
                        </div>
                      ))}
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
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Evaluation Status</h3>
                    <p className="text-sm text-gray-600">
                      {(selectedCandidate as any).isCompleted 
                        ? 'Interview completed. Evaluation pending.'
                        : 'Interview in progress. Evaluation will be available once completed.'
                      }
                    </p>
                  </div>
                )}

                {/* Interview Responses */}
                {selectedCandidate.responses && selectedCandidate.responses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Interview Responses</h3>
                    <div className="space-y-3">
                      {selectedCandidate.responses.slice(0, 3).map((response, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">Q: {response.question}</p>
                          <p className="text-sm text-gray-600">{response.answer}</p>
                        </div>
                      ))}
                      {selectedCandidate.responses.length > 3 && (
                        <button className="text-sm text-primary hover:text-primary/80 font-medium">
                          View all {selectedCandidate.responses.length} responses →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* File Attachments - placeholder for future implementation */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">File Attachments</h3>
                  <div className="text-sm text-gray-500 italic">
                    No file attachments available for this candidate.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-100 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <UserCircleIcon className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a candidate</h3>
                <p className="text-sm text-gray-500">
                  Choose a candidate from the list to view their detailed evaluation and responses
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 