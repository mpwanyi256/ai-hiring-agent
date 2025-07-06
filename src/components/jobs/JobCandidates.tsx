'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CandidatesOverview from './CandidatesOverview';
import CandidatesList from './CandidatesList';
import CandidateEvaluationSection from '@/components/evaluations/CandidateEvaluationSection';
import CandidateResponses from '@/components/candidates/CandidateResponses';
import { CurrentJob } from '@/types/jobs';
import { AppDispatch, RootState } from '@/store';
import { fetchJobCandidates, fetchCandidateResume } from '@/store/candidates/candidatesThunks';
import { 
  UserCircleIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  PaperClipIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import {
  updateCandidateRealtime,
  updateResponseRealtime,
  updateEvaluationRealtime,
  updateAIEvaluationRealtime,
  updateResumeRealtime
} from '@/store/candidates/candidatesSlice';
import { createClient } from '@/lib/supabase/client';
import { CandidateDetailsHeader } from '../evaluations/CandidateDetailsHeader';
import { CandidateBasic } from '@/types';

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
  const { 
    candidates, 
    jobCandidatesStats, 
    isLoading, 
    error
  } = useSelector((state: RootState) => state.candidates);
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch candidates when component mounts or job changes
  useEffect(() => {
    if (job.id) {
      dispatch(fetchJobCandidates({ jobId: job.id }));
    }
  }, [dispatch, job.id]);

  // Real-time listeners for candidate data
  useEffect(() => {
    if (!job.id) return;
    const supabase = createClient();
    const tables = [
      { table: 'candidates', action: updateCandidateRealtime },
      { table: 'responses', action: updateResponseRealtime },
      { table: 'evaluations', action: updateEvaluationRealtime },
      { table: 'ai_evaluations', action: updateAIEvaluationRealtime },
      { table: 'candidate_resumes', action: updateResumeRealtime }
    ];
    const channels = tables.map(({ table, action }) =>
      supabase
        .channel(`realtime:${table}:${job.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `job_id=eq.${job.id}` },
          (payload: any) => {
            if (payload.new) {
              dispatch(action(payload.new));
            }
          }
        )
        .subscribe()
    );
    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [job.id, dispatch]);

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Candidates List - Fixed height with internal scroll */}
        <div className="lg:col-span-4 h-full max-h-[800px] overflow-y-auto">
          <CandidatesList
            candidates={transformedCandidates}
            selectedCandidateId={selectedCandidateId}
            onCandidateSelect={id => {
              setSelectedCandidateId(id);
              setActiveTab('overview');
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Candidate Details - Fixed height with internal scroll */}
        <div className="lg:col-span-8 h-full max-h-[800px] overflow-y-auto">
          {selectedCandidate ? (
            <div className="bg-white rounded-lg border border-gray-100 h-full flex flex-col">
              {/* Header */}
              <CandidateDetailsHeader candidate={selectedCandidate as unknown as CandidateBasic} />

              {/* Tabs */}
              <div className="border-b border-gray-200 px-6 pt-4">
                <nav className="flex space-x-8" aria-label="Tabs">
                  {candidateTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Candidate Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <BriefcaseIcon className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium text-gray-700">Position</span>
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
                            month: 'long',
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
                                  Uploaded {new Date((selectedCandidate as any).resume.uploadedAt).toLocaleDateString()}
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
                              <ArrowDownTrayIcon className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                          </div>
                          {/* Resume evaluation summary - visually prominent */}
                          {selectedCandidate.evaluation?.resumeScore && (
                            <div className="mt-6 flex items-center gap-4">
                              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-4 border-primary">
                                <span className="text-3xl font-bold text-primary">
                                  {selectedCandidate.evaluation.resumeScore}
                                  <span className="text-base font-semibold">/100</span>
                                </span>
                              </div>
                              <div className="flex-1">
                                <span className="block text-xs font-semibold text-primary mb-1">Resume Match Score</span>
                                {selectedCandidate.evaluation.resumeSummary && (
                                  <p className="text-xs text-gray-700 mt-1">
                                    {selectedCandidate.evaluation.resumeSummary}
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
                    candidateName={(selectedCandidate as any).name || (selectedCandidate as any).fullName || 'Anonymous Candidate'}
                  />
                )}
                {activeTab === 'analytics' && (
                  <CandidateEvaluationSection
                    candidateId={selectedCandidate.id}
                    candidateName={(selectedCandidate as any).name || (selectedCandidate as any).fullName || 'Anonymous Candidate'}
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