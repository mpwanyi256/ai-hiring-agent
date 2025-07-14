'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { selectUser } from '@/store/auth/authSelectors';
import { CandidateWithEvaluation } from '@/types/candidates';
import { Loading } from '@/components/ui/Loading';
import { UserIcon, CalendarIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface JobShortlistedProps {
  jobId: string;
}

export default function JobShortlisted({ jobId }: JobShortlistedProps) {
  const user = useAppSelector(selectUser);
  const [candidates, setCandidates] = useState<CandidateWithEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShortlistedCandidates = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({
          profileId: user.id,
          jobId: jobId,
          candidateStatus: 'shortlisted',
          limit: '50',
        });

        const response = await fetch(`/api/candidates?${params}`);
        const data = await response.json();

        if (data.success) {
          setCandidates(data.candidates);
        } else {
          setError(data.error || 'Failed to fetch shortlisted candidates');
        }
      } catch (err) {
        setError('Failed to fetch shortlisted candidates');
        console.error('Error fetching shortlisted candidates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShortlistedCandidates();
  }, [user?.id, jobId]);

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
                  &nbsp;
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
                        {candidate.evaluation.score}/100
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
                      Shortlisted
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log('Schedule interview');
                      }}
                    >
                      Schedule
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
