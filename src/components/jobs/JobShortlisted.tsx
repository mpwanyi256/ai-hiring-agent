'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { CandidateWithEvaluation, CandidateStatus } from '@/types/candidates';
import { Loading } from '@/components/ui/Loading';
import { UserIcon, CalendarIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import InterviewSchedulingModal from '../interviews/InterviewSchedulingModal';
import RescheduleInterviewModal from '../dashboard/RescheduleInterviewModal';
import { fetchShortlistedCandidates } from '@/store/candidates/candidatesThunks';
import CandidateDetailsPanel from '../candidates/CandidateDetailsPanel';
import { UpdateApplicationStatus } from './UpdateApplicationStatus';
import { setSelectedCandidate } from '@/store/selectedCandidate/selectedCandidateSlice';

interface JobShortlistedProps {
  jobId: string;
}

export default function JobShortlisted({ jobId }: JobShortlistedProps) {
  const dispatch = useAppDispatch();
  const { candidates, pagination } = useAppSelector(
    (state) => state.candidates.shortlistedCandidates,
  );
  const loading = useAppSelector((state) => state.candidates.isLoading);
  const error = useAppSelector((state) => state.candidates.error);
  const [schedulingModal, setSchedulingModal] = useState<{
    isOpen: boolean;
    candidate: CandidateWithEvaluation | null;
    isEdit?: boolean;
  }>({
    isOpen: false,
    candidate: null,
    isEdit: false,
  });
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    interview: any;
  }>({
    isOpen: false,
    interview: null,
  });
  // Add state and handlers for details panel
  const [detailsPanel, setDetailsPanel] = useState<{
    isOpen: boolean;
    candidate: CandidateWithEvaluation | null;
  }>({
    isOpen: false,
    candidate: null,
  });

  const handleOpenDetails = (candidate: CandidateWithEvaluation) => {
    // TODO:: Remove all props to child components for candidate and rely on the store
    dispatch(setSelectedCandidate(candidate));
    setDetailsPanel({ isOpen: true, candidate });
  };

  const handleCloseDetails = () => {
    setDetailsPanel({ isOpen: false, candidate: null });
  };

  useEffect(() => {
    dispatch(
      fetchShortlistedCandidates({
        jobId,
        status: [
          'interview_scheduled',
          'shortlisted',
          'reference_check',
          'offer_extended',
          'offer_accepted',
          'hired',
          'withdrawn',
        ],
        page: 1,
        limit: 50,
      }),
    );

    return () => {
      dispatch(setSelectedCandidate(null));
      setDetailsPanel({ isOpen: false, candidate: null });
    };
  }, [dispatch, jobId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleCloseSchedulingModal = () => {
    setSchedulingModal({
      isOpen: false,
      candidate: null,
    });
  };

  const handleCloseRescheduleModal = () => {
    setRescheduleModal({
      isOpen: false,
      interview: null,
    });
  };

  const handleRescheduleSuccess = () => {
    // Refresh the candidates list to show updated interview details
    dispatch(
      fetchShortlistedCandidates({
        jobId,
        status: [
          'interview_scheduled',
          'shortlisted',
          'reference_check',
          'offer_extended',
          'offer_accepted',
          'hired',
          'withdrawn',
        ],
        page: 1,
        limit: 50,
      }),
    );
    handleCloseRescheduleModal();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading message="Loading shortlisted candidates..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <CheckCircleIcon className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Candidates</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <StarIcon className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Shortlisted Candidates</h3>
          <p className="text-gray-600">
            Candidates will appear here once they are shortlisted from the main candidates list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Shortlisted Candidates</h2>
          <p className="text-gray-600 mt-1">
            {pagination.total} candidate{pagination.total !== 1 ? 's' : ''} shortlisted
          </p>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommendation
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidates.map((candidate: CandidateWithEvaluation) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.firstName} {candidate.lastName}
                        </div>
                        {candidate.email && (
                          <div className="text-sm text-gray-500">{candidate.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {formatDate(candidate.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {candidate.evaluation?.score ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(candidate.evaluation.score)}`}
                      >
                        {candidate.evaluation.score}%
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No score</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UpdateApplicationStatus
                      candidateId={candidate.id}
                      status={candidate.status as CandidateStatus}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetails(candidate)}
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interview Scheduling Modal */}
      {schedulingModal.candidate && (
        <InterviewSchedulingModal
          isOpen={schedulingModal.isOpen}
          onClose={handleCloseSchedulingModal}
          candidate={schedulingModal.candidate}
          jobId={jobId}
          jobTitle={schedulingModal.candidate.jobTitle}
          isEdit={schedulingModal.isEdit}
          interview={schedulingModal.candidate.interviewDetails}
        />
      )}

      {/* Reschedule Interview Modal */}
      {rescheduleModal.interview && (
        <RescheduleInterviewModal
          interview={rescheduleModal.interview}
          isOpen={rescheduleModal.isOpen}
          onClose={handleCloseRescheduleModal}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {/* Render the details panel */}
      {detailsPanel.candidate && (
        <CandidateDetailsPanel
          isOpen={detailsPanel.isOpen}
          candidate={detailsPanel.candidate}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
