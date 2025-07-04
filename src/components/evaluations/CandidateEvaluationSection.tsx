'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchAIEvaluation, triggerAIEvaluation } from '@/store/candidates/candidatesThunks';
import RadarChart from './RadarChart';
import Button from '@/components/ui/Button';
import { evaluationUtils } from '@/lib/utils/evaluationUtils';
import { TeamAssessment, CategoryScore } from '@/types/evaluations';
import {
  StarIcon,
  SparklesIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface CandidateEvaluationSectionProps {
  candidateId: string;
  candidateName?: string;
  className?: string;
}

export default function CandidateEvaluationSection({ 
  candidateId, 
  className = '' 
}: CandidateEvaluationSectionProps) {
  const dispatch = useDispatch<AppDispatch>();
  
  const { 
    aiEvaluation: aiEvaluationState,
    error,
    isLoading 
  } = useSelector((state: RootState) => state.candidates);

  const currentEvaluation = aiEvaluationState.currentEvaluation;
  const aiEvaluation = currentEvaluation?.aiEvaluation;
  const teamAssessments = currentEvaluation?.teamAssessments || [];
  const computedValues = currentEvaluation?.computedValues;

  useEffect(() => {
    if (candidateId) {
      dispatch(fetchAIEvaluation(candidateId));
    }
  }, [candidateId, dispatch]);

  const handleTriggerAIEvaluation = () => {
    dispatch(triggerAIEvaluation({ candidateId, force: false }));
  };

  const handleForceAIEvaluation = () => {
    dispatch(triggerAIEvaluation({ candidateId, force: true }));
  };

  if (aiEvaluationState.isLoadingEvaluation || isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Error Loading Evaluation</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => dispatch(fetchAIEvaluation(candidateId))} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!aiEvaluation) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Evaluation Yet</h3>
          <p className="text-gray-600 mb-6">
            Generate an AI evaluation to see comprehensive candidate insights and scoring.
          </p>
          <Button 
            onClick={handleTriggerAIEvaluation}
            className="px-6 py-2"
            disabled={aiEvaluationState.isEvaluating}
          >
            {aiEvaluationState.isEvaluating ? (
              <>
                <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 mr-2" />
                Generate AI Evaluation
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const overallStatusColor = evaluationUtils.getStatusColor(aiEvaluation.overallStatus);
  const overallStatusText = evaluationUtils.getStatusText(aiEvaluation.overallStatus);
  const averageTeamRating = computedValues?.averageTeamRating || 0;

  return (
    <div className={`space-y-6 ${className}`}>
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
                <div className="text-4xl font-bold text-gray-900">
                  {aiEvaluation.overallScore}%
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${aiEvaluation.overallScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    AI Recommendation: <span className="font-medium capitalize">
                      {aiEvaluation.recommendation.replace('_', ' ')}
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
                      <span className="text-2xl font-bold">
                        {averageTeamRating.toFixed(1)}/5
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {teamAssessments.length} assessor{teamAssessments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {teamAssessments.slice(0, 3).map((assessment: TeamAssessment) => (
                      <div key={assessment.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {assessment.assessorName?.split(' ').map(n => n[0]).join('') || 'A'}
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
            <RadarChart radarMetrics={aiEvaluation.radarMetrics} size="md" />
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
              {Object.entries(aiEvaluation.categoryScores || {}).map(([category, data]) => {
                if (!data) return null;
                const categoryData = data as CategoryScore;
                return (
                  <div key={category} className="border-l-4 border-primary/20 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900 capitalize">
                        {category.replace('_', ' ')}
                      </h5>
                      <span className="font-bold text-primary">{categoryData.score}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{categoryData.explanation}</p>
                    {categoryData.strengths && categoryData.strengths.length > 0 && (
                      <div className="text-xs">
                        <span className="text-green-600 font-medium">Strengths: </span>
                        <span className="text-gray-600">{categoryData.strengths.join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              }).filter(Boolean)}
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
                {aiEvaluation.keyStrengths.map((strength: string, index: number) => (
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
                {aiEvaluation.areasForImprovement.map((area: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{area}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red Flags */}
            {aiEvaluation.redFlags && aiEvaluation.redFlags.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                  Red Flags
                </h4>
                <ul className="space-y-2">
                  {aiEvaluation.redFlags.map((flag: string, index: number) => (
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

        {/* Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-semibold text-gray-900 mb-2">AI Summary</h4>
          <p className="text-gray-700 text-sm leading-relaxed">
            {aiEvaluation.evaluationSummary}
          </p>
        </div>

        {/* Processing Info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                Processed in {aiEvaluation.processingDurationMs || 0}ms
              </span>
              <span>•</span>
              <span>
                Model: {aiEvaluation.aiModelVersion || 'gpt-4'}
              </span>
            </div>
            <span>
              Evaluated on {new Date(aiEvaluation.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 