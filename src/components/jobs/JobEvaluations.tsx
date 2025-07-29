'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  StarIcon,
  DocumentTextIcon,
  UserIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Job as CurrentJob } from '@/types';

interface Evaluation {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  evaluationType: string;
  summary: string;
  score: number;
  resumeScore?: number;
  strengths: string[];
  redFlags: string[];
  recommendation: string;
  feedback: string;
  createdAt: string;
}

interface EvaluationStats {
  totalEvaluated: number;
  averageScore: number;
  recommended: number;
  needReview: number;
}

interface JobEvaluationsProps {
  job: CurrentJob;
}

export default function JobEvaluations({ job }: JobEvaluationsProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [stats, setStats] = useState<EvaluationStats>({
    totalEvaluated: 0,
    averageScore: 0,
    recommended: 0,
    needReview: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/${job.id}/evaluations`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch evaluations');
      }

      setEvaluations(data.evaluations || []);

      // Calculate stats
      const evaluationsList = data.evaluations || [];
      const totalEvaluated = evaluationsList.length;
      const averageScore =
        totalEvaluated > 0
          ? Math.round(
              evaluationsList.reduce(
                (sum: number, evaluation: Evaluation) => sum + evaluation.score,
                0,
              ) / totalEvaluated,
            )
          : 0;
      const recommended = evaluationsList.filter(
        (evaluation: Evaluation) =>
          evaluation.recommendation === 'yes' || evaluation.recommendation === 'strong_yes',
      ).length;
      const needReview = evaluationsList.filter(
        (evaluation: Evaluation) => evaluation.recommendation === 'maybe',
      ).length;

      setStats({
        totalEvaluated,
        averageScore,
        recommended,
        needReview,
      });
    } catch (err) {
      console.error('Error fetching evaluations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch evaluations');
    } finally {
      setIsLoading(false);
    }
  }, [job.id]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations, job.id]);

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_yes':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'yes':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'maybe':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'no':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'strong_no':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_yes':
        return 'Strong Yes';
      case 'yes':
        return 'Yes';
      case 'maybe':
        return 'Maybe';
      case 'no':
        return 'No';
      case 'strong_no':
        return 'Strong No';
      default:
        return 'Pending';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrophyIcon className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <StarIcon className="w-5 h-5 text-yellow-600" />;
    return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-light p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3 text-muted-text">Loading evaluations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-light p-8 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-text mb-2">Error Loading Evaluations</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchEvaluations} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-light p-8 text-center">
        <ChartBarIcon className="w-12 h-12 text-muted-text mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text mb-2">No Evaluations Yet</h3>
        <p className="text-muted-text mb-6">
          Candidate evaluations will appear here once they complete their interviews.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-800 mb-2">Evaluation Features</h4>
          <ul className="text-blue-700 text-sm space-y-1 text-left max-w-md mx-auto">
            <li>• Automated scoring and ranking</li>
            <li>• Skills and experience assessment</li>
            <li>• Strengths and areas for improvement</li>
            <li>• Hiring recommendations</li>
          </ul>
        </div>

        <Button variant="outline" className="flex items-center mx-auto">
          <DocumentTextIcon className="w-4 h-4 mr-2" />
          Learn About Evaluations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Evaluation Analytics */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Evaluation Analytics</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-text">{stats.totalEvaluated}</div>
            <div className="text-sm text-muted-text">Total Evaluated</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.averageScore > 0 ? stats.averageScore : '--'}
            </div>
            <div className="text-sm text-muted-text">Average Score</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">{stats.recommended}</div>
            <div className="text-sm text-muted-text">Recommended</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.needReview}</div>
            <div className="text-sm text-muted-text">Need Review</div>
          </div>
        </div>
      </div>

      {/* Top Candidates */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Candidate Evaluations</h2>
          <Button variant="outline" size="sm" onClick={fetchEvaluations}>
            <StarIcon className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {evaluations
            .sort((a, b) => b.score - a.score) // Sort by score descending
            .map((evaluation) => (
              <div
                key={evaluation.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-text">{evaluation.candidateName}</h3>
                      <p className="text-sm text-muted-text">{evaluation.candidateEmail}</p>
                      <p className="text-xs text-muted-text">
                        Evaluated on {new Date(evaluation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getScoreIcon(evaluation.score)}
                      <span className={`text-xl font-bold ${getScoreColor(evaluation.score)}`}>
                        {evaluation.score}%
                      </span>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(evaluation.recommendation)}`}
                    >
                      {getRecommendationLabel(evaluation.recommendation)}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-text">{evaluation.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {evaluation.strengths.length > 0 && (
                    <div>
                      <h4 className="font-medium text-text text-sm mb-2">Strengths</h4>
                      <div className="flex flex-wrap gap-1">
                        {evaluation.strengths.slice(0, 4).map((strength, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                          >
                            {strength}
                          </span>
                        ))}
                        {evaluation.strengths.length > 4 && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            +{evaluation.strengths.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {evaluation.redFlags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-text text-sm mb-2">Areas for Improvement</h4>
                      <div className="flex flex-wrap gap-1">
                        {evaluation.redFlags.slice(0, 3).map((flag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded"
                          >
                            {flag}
                          </span>
                        ))}
                        {evaluation.redFlags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            +{evaluation.redFlags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-muted-text">
                    {evaluation.resumeScore && <span>Resume: {evaluation.resumeScore}%</span>}
                    <span className="capitalize">{evaluation.evaluationType} evaluation</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {evaluation.recommendation === 'yes' ||
                    evaluation.recommendation === 'strong_yes' ? (
                      <Button size="sm" className="flex items-center">
                        <TrophyIcon className="w-3 h-3 mr-1" />
                        Shortlist
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Export & Actions */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Export & Reports</h2>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={evaluations.length === 0}>
            <DocumentTextIcon className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
          <Button variant="outline" disabled={evaluations.length === 0}>
            <ChartBarIcon className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>

        <p className="text-muted-text text-sm mt-3">
          {evaluations.length > 0
            ? 'Export evaluation data and generate reports for hiring decisions.'
            : 'Export and reporting features will be available once evaluations are completed.'}
        </p>
      </div>
    </div>
  );
}
