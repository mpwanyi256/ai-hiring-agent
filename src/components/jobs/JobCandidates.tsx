'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CandidatesOverview from './CandidatesOverview';
import CandidatesList from './CandidatesList';
import CandidateEvaluationSection from '@/components/evaluations/CandidateEvaluationSection';
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
            onCandidateSelect={setSelectedCandidateId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Candidate Details - Fixed height with internal scroll */}
        <div className="lg:col-span-8 h-full max-h-[800px] overflow-y-auto">
          {selectedCandidate ? (
            <div className="bg-white rounded-lg border border-gray-100 h-full flex flex-col">
              {/* Header with gradient background - using app theme colors */}
              <CandidateDetailsHeader candidate={selectedCandidate as unknown as CandidateBasic} />

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Candidate Info Grid - using app theme colors */}
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

                {/* Resume Section */}
                {(selectedCandidate as any).resume && (
                  <div className="border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <DocumentTextIcon className="w-4 h-4 mr-2" />
                      Resume
                    </h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
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
                      
                      {/* Resume evaluation summary */}
                      {selectedCandidate.evaluation?.resumeScore && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">Resume Match Score</span>
                            <span className="text-xs font-semibold text-primary">
                              {selectedCandidate.evaluation.resumeScore}/100
                            </span>
                          </div>
                          {selectedCandidate.evaluation.resumeSummary && (
                            <p className="text-xs text-gray-600 mt-2">
                              {selectedCandidate.evaluation.resumeSummary}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Evaluation Section */}
                <CandidateEvaluationSection
                  candidateId={selectedCandidate.id}
                  candidateName={(selectedCandidate as any).name || (selectedCandidate as any).fullName || 'Anonymous Candidate'}
                />

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

                {/* File Attachments Status */}
                {!(selectedCandidate as any).resume && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <DocumentTextIcon className="w-4 h-4 mr-2" />
                      Resume
                    </h3>
                    <div className="text-sm text-gray-500 italic bg-gray-50 border border-gray-200 rounded-lg p-4">
                      No resume uploaded for this candidate.
                    </div>
                  </div>
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