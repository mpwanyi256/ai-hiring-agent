'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CandidatesOverview from './CandidatesOverview';
import CandidatesList from './CandidatesList';
import CandidateAnalytics from '@/components/evaluations/CandidateAnalytics';
import CandidateResponses from '@/components/candidates/CandidateResponses';
import { CurrentJob } from '@/types/jobs';
import { AppDispatch, RootState } from '@/store';
import { fetchJobCandidates, fetchCandidateResume } from '@/store/candidates/candidatesThunks';
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
import { CandidateBasic, CandidateList } from '@/types';

interface JobCandidatesProps {
  job: CurrentJob;
}

const candidateTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'responses', label: 'Interview Responses' },
  { id: 'analytics', label: 'Analytics' },
];

export default function JobCandidates({ job }: JobCandidatesProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { candidates, jobCandidatesStats, isLoading, error } = useSelector(
    (state: RootState) => state.candidates,
  );

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    minScore: undefined as number | undefined,
    maxScore: undefined as number | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    candidateStatus: undefined as string | undefined,
    sortBy: 'created_at' as string,
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const handleFiltersChange = (newFilters: {
    minScore?: number;
    maxScore?: number;
    startDate?: string;
    endDate?: string;
    candidateStatus?: string;
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
    if (job.id) {
      dispatch(
        fetchJobCandidates({
          jobId: job.id,
          search: searchQuery.trim() || undefined,
          ...filters,
        }),
      );
    }
  }, [dispatch, job.id, searchQuery, filters]);

  // Real-time listeners for candidate data
  // useEffect(() => {
  //   if (!job.id) return;
  //   const supabase = createClient();
  //   const tables = [
  //     { table: 'candidates', action: updateCandidateRealtime },
  //     { table: 'responses', action: updateResponseRealtime },
  //     { table: 'evaluations', action: updateEvaluationRealtime },
  //     { table: 'ai_evaluations', action: updateAIEvaluationRealtime },
  //     { table: 'candidate_resumes', action: updateResumeRealtime },
  //   ];
  //   const channels = tables.map(({ table, action }) =>
  //     supabase
  //       .channel(`realtime:${table}:${job.id}`)
  //       .on(
  //         'postgres_changes',
  //         { event: '*', schema: 'public', table, filter: `job_id=eq.${job.id}` },
  //         (payload: any) => {
  //           if (payload.new) {
  //             dispatch(action(payload.new));
  //           }
  //         },
  //       )
  //       .subscribe(),
  //   );
  //   return () => {
  //     channels.forEach((ch) => supabase.removeChannel(ch));
  //   };
  // }, [job.id, dispatch]);

  // Use candidates directly from state (no frontend filtering)
  const selectedCandidate = selectedCandidateId
    ? candidates.find((c) => c.id === selectedCandidateId)
    : null;

  // Transform data for components
  const overviewData = {
    totalCandidates: jobCandidatesStats.total,
    inProgress: jobCandidatesStats.inProgress,
    completed: jobCandidatesStats.completed,
    averageScore: jobCandidatesStats.averageScore,
  };

  // Transform candidates for the list component
  const transformedCandidates: CandidateList[] = candidates.map((candidate) => {
    return {
      id: candidate.id,
      jobId: candidate.jobId,
      jobTitle: candidate.jobTitle,
      interviewToken: candidate.interviewToken,
      email: candidate.email,
      submittedAt: candidate.submittedAt,
      evaluation: candidate.evaluation,
      responses: candidate.responses,
      resume: candidate.resume,
      candidateStatus: candidate.candidateStatus,
      name: candidate.name,
      score: candidate.evaluation?.score,
      progress: candidate.progress,
      resumeScore: candidate.resumeScore || candidate.evaluation?.resumeScore,
      createdAt: candidate.createdAt || new Date().toISOString(),
      status: candidate.status,
    };
  });

  // Resume download handler
  const handleResumeDownload = async (candidateId: string) => {
    try {
      const result = await dispatch(fetchCandidateResume(candidateId));
      if (result.payload?.publicUrl) {
        // Open the resume in a new tab
        window.open(result.payload.publicUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to download resume:', error);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-4">
        {/* Candidates List - Fixed height with internal scroll */}
        <div className="lg:col-span-4 h-full max-h-[800px] overflow-y-auto">
          <CandidatesList
            candidates={transformedCandidates}
            selectedCandidateId={selectedCandidateId}
            onCandidateSelect={(id) => {
              setSelectedCandidateId(id);
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
              <CandidateDetailsHeader candidate={selectedCandidate as unknown as CandidateBasic} />

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
                          {new Date(
                            (selectedCandidate as any).createdAt || new Date(),
                          ).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
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
                    <div className="border border-gray-200 rounded-lg p-4 mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        Resume
                      </h3>
                      {(selectedCandidate as any).resume ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                                <PaperClipIcon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {(selectedCandidate as any).resume.filename}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize((selectedCandidate as any).resume.fileSize)} •
                                  {(selectedCandidate as any).resume.fileType?.toUpperCase()} •
                                  Uploaded{' '}
                                  {new Date(
                                    (selectedCandidate as any).resume.uploadedAt,
                                  ).toLocaleDateString()}
                                </p>
                                {(selectedCandidate as any).resume.wordCount && (
                                  <p className="text-xs text-gray-500">
                                    {(selectedCandidate as any).resume.wordCount} words
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleResumeDownload(selectedCandidate.id)}
                              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                              <span>View</span>
                            </button>
                          </div>
                          {/* Resume evaluation summary - visually prominent */}
                          {(selectedCandidate as any).evaluation?.resumeScore && (
                            <div className="mt-6 flex items-center gap-4">
                              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-4 border-primary">
                                <span className="text-lg font-bold text-primary">
                                  {(selectedCandidate as any).evaluation.resumeScore}
                                  <span className="text-base font-semibold">/100</span>
                                </span>
                              </div>
                              <div className="flex-1">
                                <span className="block text-xs font-semibold text-primary mb-1">
                                  Resume Match Score
                                </span>
                                {(selectedCandidate as any).evaluation.resumeSummary && (
                                  <p className="text-xs text-gray-700 mt-1">
                                    {(selectedCandidate as any).evaluation.resumeSummary}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic bg-gray-50 border border-gray-200 rounded-lg p-4">
                          No resume uploaded for this candidate.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'responses' && (
                  <CandidateResponses
                    candidateId={selectedCandidate.id}
                    jobId={job.id}
                    candidateName={
                      (selectedCandidate as any).name ||
                      (selectedCandidate as any).fullName ||
                      'Anonymous Candidate'
                    }
                  />
                )}
                {activeTab === 'analytics' && (
                  <CandidateAnalytics
                    candidateId={selectedCandidate.id}
                    candidateName={
                      (selectedCandidate as any).name ||
                      (selectedCandidate as any).fullName ||
                      'Anonymous Candidate'
                    }
                    jobId={job.id}
                  />
                )}
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
