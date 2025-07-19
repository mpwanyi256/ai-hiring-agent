'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CandidatesOverview from './CandidatesOverview';
import CandidatesList from './CandidatesList';
import CandidateAnalytics from '@/components/evaluations/CandidateAnalytics';
import CandidateResponses from '@/components/candidates/CandidateResponses';
import { AppDispatch, useAppSelector } from '@/store';
import { fetchJobCandidates } from '@/store/candidates/candidatesThunks';
import {
  UserCircleIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  PaperClipIcon,
  BriefcaseIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { CandidateDetailsHeader } from '../evaluations/CandidateDetailsHeader';
import { CandidateStatus } from '@/types';
import { formatFileSize } from '@/lib/utils';
import AIEvaluationCard from '@/components/evaluations/AIEvaluationCard';
import {
  selectSelectedCandidate,
  selectSelectedCandidateId,
} from '@/store/selectedCandidate/selectedCandidateSelectors';
import { selectCurrentJob } from '@/store/jobs/jobsSelectors';
import { selectJobCandidatesStats } from '@/store/candidates/candidatesSelectors';
import { CandidateSkillsAnalysis } from './CandidateSkillsAnalysis';

const candidateTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'responses', label: 'Interview Responses' },
  { id: 'analytics', label: 'Analytics' },
];

const getResumeScoreStyle = (score: number) => {
  if (score >= 80) return 'bg-green-50 border-green-600';
  if (score >= 65) return 'bg-yellow-50 border-yellow-600';
  if (score >= 50) return 'bg-orange-50 border-orange-600';
  return 'bg-red-50 border-red-600';
};

const getResumeScoreTextColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 65) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
};

export default function JobCandidates() {
  const job = useAppSelector(selectCurrentJob);
  const dispatch = useDispatch<AppDispatch>();
  const jobCandidatesStats = useAppSelector(selectJobCandidatesStats);

  const selectedCandidateId = useSelector(selectSelectedCandidateId);
  const selectedCandidate = useSelector(selectSelectedCandidate);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    minScore: undefined as number | undefined,
    maxScore: undefined as number | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    candidateStatus: undefined as CandidateStatus | undefined,
    sortBy: 'created_at' as string,
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const handleFiltersChange = (newFilters: {
    minScore?: number;
    maxScore?: number;
    startDate?: string;
    endDate?: string;
    candidateStatus?: CandidateStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  // Fetch candidates when component mounts or job changes
  useEffect(() => {
    if (job && job.id) {
      dispatch(
        fetchJobCandidates({
          jobId: job.id,
          search: searchQuery.trim() || undefined,
          ...filters,
          candidateStatus: filters.candidateStatus as CandidateStatus | undefined,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, job?.id, searchQuery, filters]);

  // Transform data for components
  const overviewData = {
    totalCandidates: jobCandidatesStats.total,
    shortlisted: job?.shortlistedCount || 0,
    completed: jobCandidatesStats.completed,
    averageScore: jobCandidatesStats.averageScore,
  };

  // Resume download handler
  const handleResumeDownload = async () => {
    try {
      if (selectedCandidate?.resume?.publicUrl) {
        // Open the resume in a new tab
        window.open(selectedCandidate.resume.publicUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to download resume:', error);
    }
  };

  if (!job) {
    return <div>No job found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <CandidatesOverview {...overviewData} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-4">
        {/* Candidates List - Fixed height with internal scroll */}
        <div className="lg:col-span-4 h-full max-h-[800px] overflow-y-auto">
          <CandidatesList
            selectedCandidateId={selectedCandidateId}
            onCandidateSelect={() => {
              setActiveTab('overview');
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Candidate Details - Fixed height with internal scroll */}
        <div className="lg:col-span-8 h-full max-h-[800px] overflow-y-auto">
          {selectedCandidate ? (
            <div className="bg-white rounded-lg border border-gray-100 h-full flex flex-col">
              {/* Header */}
              <CandidateDetailsHeader />

              {/* Tabs */}
              <div className="border-b border-gray-200 px-6 pt-4 md:px-4 md:pt-2">
                <nav className="flex space-x-8 md:space-x-4" aria-label="Tabs">
                  {candidateTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-2 md:py-1 px-1 border-b-2 font-medium text-sm md:text-xs transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-4">
                {activeTab === 'overview' && (
                  <div className="space-y-6 md:space-y-4">
                    {/* Candidate Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 mb-6 md:mb-4">
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 md:p-3">
                        <div className="flex items-center space-x-2 mb-2 md:mb-1">
                          <BriefcaseIcon className="w-5 h-5 md:w-4 md:h-4 text-primary" />
                          <span className="text-sm md:text-xs font-medium text-gray-700">
                            Position
                          </span>
                        </div>
                        <p className="text-sm md:text-xs text-gray-900 font-medium">{job.title}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 md:p-3">
                        <div className="flex items-center space-x-2 mb-2 md:mb-1">
                          <CalendarIcon className="w-5 h-5 md:w-4 md:h-4 text-blue-600" />
                          <span className="text-sm md:text-xs font-medium text-gray-700">
                            Application Date
                          </span>
                        </div>
                        <p className="text-sm md:text-xs text-gray-900 font-medium">
                          {new Date(selectedCandidate?.createdAt || new Date()).toLocaleDateString(
                            'en-US',
                            {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            },
                          )}
                        </p>
                      </div>
                      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 md:p-3">
                        <div className="flex items-center space-x-2 mb-2 md:mb-1">
                          <ChartBarIcon className="w-5 h-5 md:w-4 md:h-4 text-purple-600" />
                          <span className="text-sm md:text-xs font-medium text-gray-700">
                            Experience
                          </span>
                        </div>
                        <p className="text-sm md:text-xs text-gray-900 font-medium">
                          {job.fields?.experienceLevel?.replace(/([A-Z])/g, ' $1').trim() ||
                            'Not specified'}
                        </p>
                      </div>
                    </div>

                    {/* Resume Section (merged) */}
                    <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-4 mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        Resume
                      </h3>
                      {selectedCandidate?.resume ? (
                        <>
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                                <PaperClipIcon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {selectedCandidate?.resume.filename}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {selectedCandidate?.resume
                                    ? formatFileSize(selectedCandidate.resume.fileSize)
                                    : ''}{' '}
                                  •{selectedCandidate?.resume?.fileType?.toUpperCase()} • Uploaded{' '}
                                  {selectedCandidate?.resume
                                    ? new Date(
                                        selectedCandidate.resume.uploadedAt,
                                      ).toLocaleDateString()
                                    : ''}
                                </p>
                                {selectedCandidate?.resume?.wordCount && (
                                  <p className="text-xs text-gray-500">
                                    {selectedCandidate.resume.wordCount} words
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={handleResumeDownload}
                              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                              <span>View</span>
                            </button>
                          </div>
                          {/* Resume evaluation summary - visually prominent */}
                          {selectedCandidate?.evaluation && (
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`flex items-center justify-center w-10 h-10 rounded-full ${getResumeScoreStyle(selectedCandidate?.evaluation?.resumeScore)}`}
                                >
                                  <span
                                    className={`text-lg font-bold ${getResumeScoreTextColor(selectedCandidate?.evaluation?.resumeScore)}`}
                                  >
                                    {selectedCandidate?.evaluation?.resumeScore}
                                    <span className="text-base font-semibold">%</span>
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <span className="block text-md font-semibold text-primary mb-1">
                                    Resume Match Score
                                  </span>
                                </div>
                              </div>
                              <CandidateSkillsAnalysis />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 italic bg-gray-50 border border-gray-200 rounded-lg p-4">
                          No resume uploaded for this candidate.
                        </div>
                      )}
                    </div>

                    {/* AI Evaluation Card below resume */}
                    {selectedCandidate ? <AIEvaluationCard /> : null}
                  </div>
                )}
                {activeTab === 'responses' && <CandidateResponses />}
                {activeTab === 'analytics' && <CandidateAnalytics />}
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
