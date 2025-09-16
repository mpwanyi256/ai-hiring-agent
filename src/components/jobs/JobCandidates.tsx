'use client';

import React, { useState, useEffect } from 'react';
import CandidatesOverview from './CandidatesOverview';
import CandidatesList from './CandidatesList';
import CandidateAnalytics from '@/components/evaluations/CandidateAnalytics';
import CandidateResponses from '@/components/candidates/CandidateResponses';
import { TeamResponses } from '@/components/candidates/TeamResponses';
import { useAppSelector } from '@/store';
import {
  UserCircleIcon,
  CalendarIcon,
  PaperClipIcon,
  BriefcaseIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { CandidateDetailsHeader } from '../evaluations/CandidateDetailsHeader';
import { formatFileSize } from '@/lib/utils';
import AIEvaluationCard from '@/components/evaluations/AIEvaluationCard';
import {
  selectSelectedCandidate,
  selectSelectedCandidateId,
  selectSelectedCandidateLoading,
} from '@/store/selectedCandidate/selectedCandidateSelectors';
import { selectJobCandidatesStats } from '@/store/candidates/candidatesSelectors';
import { selectJobPermissions } from '@/store/jobPermissions/jobPermissionsSelectors';
import { selectUser } from '@/store/auth/authSelectors';
import { CandidateRemiseModal } from './CandidateRemiseModal';
import { Candidate } from '@/types/candidates';
import { JobPermission } from '@/types/jobPermissions';
import { Loading } from '@/components/ui/Loading';

// Small reusable components
const InfoCard = ({
  icon: Icon,
  label,
  value,
  className = '',
}: {
  icon: React.ComponentType<{ className: string }>;
  label: string;
  value: string;
  className?: string;
}) => (
  <div className={`bg-gray-50 p-4 md:p-3 rounded-lg ${className}`}>
    <div className="flex items-center">
      <Icon className="h-5 w-5 text-gray-400 mr-2" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
    <p className="mt-1 text-sm text-gray-900">{value}</p>
  </div>
);

const ResumeSection = ({ candidate }: { candidate: Candidate }) => {
  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false);
  const getResumeScoreStyle = (score: number | null | undefined) => {
    if (!score) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getResumeScoreTextColor = (score: number | null | undefined) => {
    if (!score) return 'text-gray-700';
    if (score >= 80) return 'text-green-800';
    if (score >= 60) return 'text-yellow-800';
    return 'text-red-800';
  };

  if (!candidate.resume) return null;

  return (
    <div className="border rounded-lg p-4 md:p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 mb-3 md:mb-2 flex items-center">
          <PaperClipIcon className="h-5 w-5 mr-2" />
          Resume
        </h3>
        {/* View  */}
        <button
          type="button"
          onClick={() => setIsResumePreviewOpen(true)}
          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
        >
          View Resume
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{candidate.resume.filename}</p>
          <p className="text-xs text-gray-500">
            {formatFileSize(candidate.resume.fileSize)} • {candidate.resume.wordCount} words
          </p>
        </div>
        {candidate.evaluation?.resumeScore && (
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${getResumeScoreStyle(
              candidate.evaluation.resumeScore,
            )} ${getResumeScoreTextColor(candidate.evaluation.resumeScore)}`}
          >
            Resume Score: {candidate.evaluation.resumeScore}%
          </div>
        )}
      </div>
      {/* Modal */}
      <CandidateRemiseModal
        isOpen={isResumePreviewOpen}
        onClose={() => setIsResumePreviewOpen(false)}
        resumeUrl={candidate.resume.publicUrl}
      />
    </div>
  );
};

const CandidateOverviewTab = ({ candidate }: { candidate: Candidate }) => (
  <div className="space-y-6 md:space-y-4">
    {/* Candidate Info Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3">
      <InfoCard
        icon={UserCircleIcon}
        label="Status"
        value={candidate.status}
        className="capitalize"
      />
      <InfoCard
        icon={CalendarIcon}
        label="Applied"
        value={new Date(candidate.createdAt).toLocaleDateString()}
      />
      <InfoCard icon={BriefcaseIcon} label="Progress" value={`${candidate.progress}%`} />
    </div>

    {/* Resume Section */}
    <ResumeSection candidate={candidate} />

    {/* AI Evaluation Card */}
    <AIEvaluationCard />
  </div>
);

// Get user's permission level for the current job
const getUserPermissionLevel = (permissions: JobPermission[], userId: string | undefined) => {
  if (!userId) return null;
  const userPermission = permissions.find((p) => p.user_id === userId);
  return userPermission?.permission_level || null;
};

const candidateTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'responses', label: 'Interview Responses' },
  { id: 'ai-evaluation', label: 'AI Evaluation' },
  { id: 'team-responses', label: 'Team Responses' },
];

export default function JobCandidates() {
  const selectedCandidate = useAppSelector(selectSelectedCandidate);
  const selectedCandidateId = useAppSelector(selectSelectedCandidateId);
  const stats = useAppSelector(selectJobCandidatesStats);
  const permissions = useAppSelector(selectJobPermissions);
  const user = useAppSelector(selectUser);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const loading = useAppSelector(selectSelectedCandidateLoading);

  // Get user's permission level
  const userPermissionLevel = getUserPermissionLevel(permissions, user?.id);

  // Filter tabs based on user permissions - only show team-responses to interviewer+ level
  const filteredTabs = candidateTabs.filter((tab) => {
    if (tab.id === 'team-responses') {
      return (
        userPermissionLevel && ['interviewer', 'manager', 'admin'].includes(userPermissionLevel)
      );
    }
    return true;
  });

  // Reset active tab if it's not available for the user
  useEffect(() => {
    if (
      activeTab === 'team-responses' &&
      !filteredTabs.find((tab) => tab.id === 'team-responses')
    ) {
      setActiveTab('overview');
    }
  }, [activeTab, filteredTabs]);

  const handleCandidateSelect = () => {
    setActiveTab('overview');
  };

  return (
    <div className="space-y-6">
      <CandidatesOverview
        totalCandidates={stats.total}
        shortlisted={0}
        completed={stats.completed}
        averageScore={stats.averageScore}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-4">
        <div className="lg:col-span-4 h-full max-h-[800px] overflow-hidden">
          <CandidatesList
            selectedCandidateId={selectedCandidateId}
            onCandidateSelect={handleCandidateSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        {loading ? (
          <Loading
            message="Loading candidate details..."
            className="lg:col-span-8 h-full max-h-[800px] overflow-y-auto"
          />
        ) : (
          <div className="lg:col-span-8 h-full max-h-[800px] overflow-y-auto">
            {selectedCandidate && selectedCandidate?.progress >= 90 ? (
              <div className="bg-white rounded-lg border border-gray-100 h-full flex flex-col">
                <CandidateDetailsHeader />

                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6 md:px-4">
                    {filteredTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-4">
                  {activeTab === 'overview' && (
                    <CandidateOverviewTab candidate={selectedCandidate} />
                  )}
                  {activeTab === 'responses' && <CandidateResponses />}
                  {activeTab === 'ai-evaluation' && <CandidateAnalytics />}
                  {activeTab === 'team-responses' && <TeamResponses />}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-100 h-full flex items-center justify-center">
                <div className="text-center">
                  <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {selectedCandidate && selectedCandidate?.progress < 90
                      ? 'Candidate has not completed the interview'
                      : 'No candidate selected'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedCandidate && selectedCandidate?.progress < 90
                      ? 'Details will be available once the interview is completed'
                      : 'Select a candidate to view their details'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
