'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchAIEvaluation, triggerAIEvaluation } from '@/store/candidates/candidatesThunks';
import RadarChart from './RadarChart';
import Button from '@/components/ui/Button';
import {
  ClockIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  UserGroupIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { LoadingAIEvaluations } from './LoadingAIEvaluations';
import { NoAIEvaluations } from './NoAIEvaluations';
import { ErrorLoadingAIEvaluations } from './ErrorLoadingAIEvaluations';
import { RadarMetrics } from '@/types/evaluations';

// Type definition for the actual API response
interface ActualAIEvaluation {
  id: string;
  candidateId: string;
  jobId: string;
  profileId: string;
  overallScore: number;
  overallStatus: string;
  recommendation: string;
  evaluationSummary: string;
  evaluationExplanation: string;
  radarMetrics: RadarMetrics;
  categoryScores: Record<string, any>;
  keyStrengths: string[];
  areasForImprovement: string[];
  redFlags: string[];
  evaluationSources: any;
  processingDurationMs: number;
  aiModelVersion: string;
  evaluationVersion: string;
  createdAt: string;
  updatedAt: string;
}

interface CandidateEvaluationSectionProps {
  candidateId: string;
  candidateName?: string;
  className?: string;
}

export default function CandidateEvaluationSection({
  candidateId,
  className = '',
}: CandidateEvaluationSectionProps) {
  const dispatch = useDispatch<AppDispatch>();

  const {
    aiEvaluation: aiEvaluationState,
    error,
    isLoading,
  } = useSelector((state: RootState) => state.candidates);

  const currentEvaluation = aiEvaluationState.currentEvaluation;
  const aiEvaluation = currentEvaluation?.aiEvaluation as ActualAIEvaluation | null;
  const teamAssessments = currentEvaluation?.teamAssessments || [];
  const computedValues = currentEvaluation?.computedValues;

  useEffect(() => {
    if (candidateId) {
      dispatch(fetchAIEvaluation(candidateId));
    }
  }, [candidateId, dispatch]);

  const handleForceAIEvaluation = () => {
    dispatch(triggerAIEvaluation({ candidateId, force: true }));
  };

  if (aiEvaluationState.isLoadingEvaluation || isLoading) {
    return <LoadingAIEvaluations className={className} />;
  }

  if (error) {
    return (
      <ErrorLoadingAIEvaluations error={error} candidateId={candidateId} className={className} />
    );
  }

  if (!aiEvaluation) {
    return <NoAIEvaluations candidateId={candidateId} />;
  }

  // Use the actual properties from the API response
  const overallScore = aiEvaluation.overallScore || 0;
  const overallStatus = aiEvaluation.overallStatus || 'pending';
  const recommendation = aiEvaluation.recommendation || 'maybe';
  const keyStrengths = aiEvaluation.keyStrengths || [];
  const areasForImprovement = aiEvaluation.areasForImprovement || [];
  const redFlags = aiEvaluation.redFlags || [];
  const radarMetrics = aiEvaluation.radarMetrics || {};
  const categoryScores = aiEvaluation.categoryScores || {};
  const evaluationSummary = aiEvaluation.evaluationSummary || '';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'strong_yes':
      case 'yes':
        return 'text-green-600 bg-green-100';
      case 'maybe':
        return 'text-yellow-600 bg-yellow-100';
      case 'no':
      case 'strong_no':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
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

  const overallStatusColor = getStatusColor(overallStatus);
  const overallStatusText = getStatusText(overallStatus);
  const averageTeamRating =
    typeof computedValues?.averageTeamRating === 'number' ? computedValues.averageTeamRating : 0;

  return (
    <div className={`space-y-6 mb-6 ${className}`}>
      {/* Overall Score Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">AI Evaluation Results</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceAIEvaluation}
              disabled={aiEvaluationState.isEvaluating}
            >
              {aiEvaluationState.isEvaluating ? (
                <>
                  <ClockIcon className="w-4 h-4 mr-1 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                  Re-evaluate
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Overall Score & Team Assessment */}
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${overallStatusColor}`}>
                  {overallStatusText}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold text-gray-900">{overallScore}%</div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${overallScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    AI Recommendation:{' '}
                    <span className="font-medium capitalize">
                      {recommendation.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Team Assessment Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Team Assessment</h3>
                <UserGroupIcon className="w-5 h-5 text-gray-500" />
              </div>

              {teamAssessments.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StarIcon className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold">{averageTeamRating.toFixed(1)}/5</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {teamAssessments.length} assessor{teamAssessments.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {teamAssessments.slice(0, 3).map((assessment: any) => (
                      <div
                        key={assessment.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {assessment.assessorName
                                ?.split(' ')
                                .map((n: string) => n[0])
                                .join('') || 'A'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">{assessment.assessorName}</span>
                            <span className="text-gray-500 ml-1">- {assessment.assessorRole}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${
                                i < assessment.overallRating ? 'text-yellow-500' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No team assessments yet</p>
                  <p className="text-gray-400 text-xs mt-1">Manual assessments will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Radar Chart */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Competency Analysis</h3>
            <RadarChart radarMetrics={radarMetrics} size="md" />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Analysis</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Scores */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Category Breakdown</h4>
            <div className="space-y-4">
              {Object.entries(categoryScores).map(([category, data]: [string, any]) => {
                if (!data) return null;
                return (
                  <div key={category} className="border-l-4 border-primary/20 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900 capitalize">
                        {category.replace('_', ' ')}
                      </h5>
                      <span className="font-bold text-primary">{data.score}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{data.explanation}</p>
                    {data.strengths && data.strengths.length > 0 && (
                      <div className="text-xs">
                        <span className="text-green-600 font-medium">Strengths: </span>
                        <span className="text-gray-600">{data.strengths.join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-6">
            {/* Key Strengths */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                Key Strengths
              </h4>
              <ul className="space-y-2">
                {keyStrengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500 mr-2" />
                Areas for Improvement
              </h4>
              <ul className="space-y-2">
                {areasForImprovement.map((area: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{area}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red Flags */}
            {redFlags && redFlags.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                  Red Flags
                </h4>
                <ul className="space-y-2">
                  {redFlags.map((flag: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evaluation Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Summary</h3>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed">{evaluationSummary}</p>
        </div>
      </div>
    </div>
  );
}
