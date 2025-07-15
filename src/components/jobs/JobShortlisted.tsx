'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { CandidateWithEvaluation } from '@/types/candidates';
import { Loading } from '@/components/ui/Loading';
import { UserIcon, CalendarIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import InterviewSchedulingModal from '../interviews/InterviewSchedulingModal';
import { fetchShortlistedCandidates } from '@/store/candidates/candidatesThunks';

interface JobShortlistedProps {
  jobId: string;
}

export default function JobShortlisted({ jobId }: JobShortlistedProps) {
  const dispatch = useAppDispatch();
  const candidates = useAppSelector((state) => state.candidates.shortlistedCandidates);
  const loading = useAppSelector((state) => state.candidates.isLoading);
  const error = useAppSelector((state) => state.candidates.error);
  const [schedulingModal, setSchedulingModal] = useState<{
    isOpen: boolean;
    candidate: CandidateWithEvaluation | null;
  }>({
    isOpen: false,
    candidate: null,
  });

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

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_yes':
        return 'text-green-700 bg-green-100';
      case 'yes':
        return 'text-green-600 bg-green-50';
      case 'maybe':
        return 'text-yellow-600 bg-yellow-50';
      case 'no':
        return 'text-red-600 bg-red-50';
      case 'strong_no':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleScheduleInterview = (candidate: CandidateWithEvaluation) => {
    setSchedulingModal({
      isOpen: true,
      candidate,
    });
  };

  const handleCloseSchedulingModal = () => {
    setSchedulingModal({
      isOpen: false,
      candidate: null,
    });
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
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} shortlisted
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommendation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidates.map((candidate) => (
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
                    {candidate.evaluation?.recommendation ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecommendationColor(candidate.evaluation.recommendation)}`}
                      >
                        {candidate.evaluation.recommendation.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No recommendation</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <StarIcon className="w-3 h-3 mr-1" />
                      {candidate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleScheduleInterview(candidate)}
                      >
                        Schedule Interview
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
        />
      )}
    </div>
  );
}
