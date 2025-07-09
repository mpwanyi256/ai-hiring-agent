'use client';

import React, { useState, useEffect } from 'react';
import { apiError } from '@/lib/notification';
import {
  ChartBarIcon,
  UserGroupIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CpuChipIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { Loading } from '../ui/Loading';
import {
  selectSelectedCandidate,
  selectSelectedCandidateAnalytics,
  selectSelectedCandidateEvaluation,
} from '@/store/selectedCandidate/selectedCandidateSelectors';
import { getInterviewScoreColor, getResumeScoreColor } from '@/lib/utils';
import { fetchSelectedCandidateAnalytics } from '@/store/selectedCandidate/selectedCandidateThunks';
import { useAppDispatch, useAppSelector } from '@/store';

interface CandidateAnalyticsProps {
  className?: string;
}

export default function CandidateAnalytics({ className = '' }: CandidateAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const candidateEvaluation = useAppSelector(selectSelectedCandidateEvaluation);
  const analyticsData = useAppSelector(selectSelectedCandidateAnalytics);
  const candidate = useAppSelector(selectSelectedCandidate);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        await dispatch(fetchSelectedCandidateAnalytics());
      } catch (err) {
        apiError(err instanceof Error ? err.message : 'Failed to load candidate analytics');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [dispatch]);

  if (isLoading) {
    return <Loading message="Loading analytics..." />;
  }

  if (
    !analyticsData ||
    !analyticsData.analytics ||
    !analyticsData.comparative_data ||
    Object.keys(analyticsData.analytics).length === 0 ||
    Object.keys(analyticsData.comparative_data).length === 0
  ) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
            <p className="text-gray-500">
              Analytics for this candidate have not been generated yet. Once the candidate completes
              their interview and is evaluated, analytics will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { analytics, response_analytics, comparative_data } = analyticsData;

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Detailed Analytics</h2>
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-4 md:w-5 h-4 md:h-5 text-primary" />
            <span className="text-xs md:text-sm text-gray-500">Real-time insights</span>
          </div>
        </div>
        <p className="text-xs md:text-sm text-gray-600">
          Comprehensive analysis of {candidate?.firstName}&apos;s performance and engagement metrics
        </p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Overall Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Overall Score</h3>
            <TrophyIcon className="w-4 md:w-5 h-4 md:h-5 text-yellow-500" />
          </div>
          <div className="flex items-baseline">
            <span
              className={`text-2xl md:text-xl font-bold ${getScoreColor(analytics.overall_score)}`}
            >
              {analytics.overall_score}%
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
              <div
                className="bg-primary h-1.5 md:h-2 rounded-full transition-all"
                style={{ width: `${analytics.overall_score}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] md:text-xs text-gray-500 mt-2">
            Rank #{analytics.rank_in_job} of {analytics.total_candidates_in_job} candidates
          </p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Completion Rate</h3>
            <CheckCircleIcon className="w-4 md:w-5 h-4 md:h-5 text-green-500" />
          </div>
          <div className="flex items-baseline">
            <span
              className={`text-2xl md:text-xl font-bold ${getScoreColor(analytics.completion_percentage)}`}
            >
              {analytics.completion_percentage}%
            </span>
          </div>
          <p className="text-[10px] md:text-xs text-gray-500 mt-2">
            {analytics.total_responses} of {analytics.total_questions}
          </p>
        </div>

        {/* Engagement Level */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Engagement</h3>
            <UserGroupIcon className="w-4 md:w-5 h-4 md:h-5 text-blue-500" />
          </div>
          <div className="flex items-baseline">
            <span
              className={`text-2xl md:text-xl font-bold capitalize ${getEngagementColor(analytics.engagement_level).split(' ')[0]}`}
            >
              {analytics.engagement_level}
            </span>
          </div>
          <div
            className={`mt-2 inline-flex px-2 md:px-4 md:text-xs py-1 rounded-full text-xs font-medium ${getEngagementColor(analytics.engagement_level)}`}
          >
            {analytics.time_spent_minutes} minutes spent
          </div>
        </div>

        {/* Percentile Rank */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Percentile</h3>
            <TagIcon className="w-4 md:w-5 h-4 md:h-5 text-purple-500" />
          </div>
          <div className="flex items-baseline">
            <span
              className={`text-2xl md:text-xl font-bold ${getScoreColor(analytics.percentile_rank)}`}
            >
              {analytics.percentile_rank}
            </span>
            <span className="ml-1 text-xs md:text-sm text-gray-500">th</span>
          </div>
          <p className="text-[10px] md:text-xs text-gray-500 mt-2">
            Top {100 - analytics.percentile_rank}% of candidates
          </p>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="flex flex-col gap-4 bg-white rounded-lg border border-gray-200 p-4 md:p-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Resume Score */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CpuChipIcon className="w-4 md:w-5 h-4 md:h-5 text-blue-500 mr-2" />
              <span className="text-xs md:text-sm font-medium text-gray-700">Interview Score</span>
            </div>
            <div
              className={`text-2xl md:text-3xl font-bold ${getResumeScoreColor(analytics.resume_score)}`}
            >
              {analytics.resume_score}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2 mt-2">
              <div
                className={`${getInterviewScoreColor(analytics.resume_score)} h-1.5 md:h-2 rounded-full`}
                style={{ width: `${analytics.resume_score}%` }}
              />
            </div>
          </div>

          {/* Interview Score */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <DocumentTextIcon className="w-4 md:w-5 h-4 md:h-5 text-green-500 mr-2" />
              <span className="text-xs md:text-sm font-medium text-gray-700">
                Resume Match Score
              </span>
            </div>
            <div
              className={`text-2xl md:text-3xl font-bold ${getScoreColor(candidateEvaluation?.resumeScore || 0)}`}
            >
              {candidateEvaluation?.resumeScore || 0}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2 mt-2">
              <div
                className="bg-green-500 h-1.5 md:h-2 rounded-full"
                style={{ width: `${candidateEvaluation?.resumeScore || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Response Analytics */}
      {response_analytics.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col mb-1">
            <h3 className="text-lg font-semibold text-gray-900 mr-2">Response Analytics</h3>
            <span className="flex bg-primary/10 rounded-lg p-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-blue-400 mr-1" />
              <span className="text-xs text-gray-700">
                Each response&apos;s quality % reflects how well the answer meets the
                question&apos;s requirements, based on the question estimated response time versus
                the actual response time.
              </span>
            </span>
          </div>
          <div className="space-y-4 mt-2">
            {response_analytics.map((response, index) => (
              <div key={response.response_id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm font-medium text-gray-700">
                    Response #{index + 1}
                  </span>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{response.response_length_words} words</span>
                    <span>{formatTime(response.response_time_seconds)}</span>
                    <span
                      className={`font-medium ${getScoreColor(response.response_quality_score)}`}
                    >
                      {response.response_quality_score}% quality
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                  <div
                    className="bg-primary h-1.5 md:h-2 rounded-full"
                    style={{ width: `${response.response_quality_score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparative Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparative Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {comparative_data.total_candidates}
            </div>
            <div className="text-xs text-gray-500">Total Candidates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {comparative_data.average_score.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Average Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {comparative_data.median_score.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Median Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {comparative_data.top_percentile.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Top 10% Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {comparative_data.completion_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Avg Completion</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {comparative_data.average_time_spent.toFixed(0)}m
            </div>
            <div className="text-xs text-gray-500">Avg Time Spent</div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col mb-1">
          <h3 className="text-lg font-semibold text-gray-900 mr-2">Performance Insights</h3>
          <span className="flex bg-primary/10 rounded-lg p-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-blue-400 mr-1" />
            <span className="text-xs text-gray-700">
              These figures compare the candidate&apos;s performance to the average of all
              candidates for this job. Positive values mean above average; negative means below
              average.
            </span>
          </span>
        </div>
        <div className="space-y-4 mt-2">
          {/* Score Comparison */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {analytics.overall_score > comparative_data.average_score ? (
                <ArrowTrendingUpIcon className="w-4 md:w-5 h-4 md:h-5 text-green-500 mr-2" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 md:w-5 h-4 md:h-5 text-red-500 mr-2" />
              )}
              <span className="text-xs md:text-sm font-medium text-gray-700">Score vs Average</span>
            </div>
            <div className="text-xs md:text-sm">
              <span
                className={`font-medium ${analytics.overall_score > comparative_data.average_score ? 'text-green-600' : 'text-red-600'}`}
              >
                {analytics.overall_score > comparative_data.average_score ? '+' : ''}
                {(analytics.overall_score - comparative_data.average_score).toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-1">
                vs {comparative_data.average_score.toFixed(1)}% average
              </span>
            </div>
          </div>
          {/* Completion Comparison */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {analytics.completion_percentage > comparative_data.completion_rate ? (
                <ArrowTrendingUpIcon className="w-4 md:w-5 h-4 md:h-5 text-green-500 mr-2" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 md:w-5 h-4 md:h-5 text-red-500 mr-2" />
              )}
              <span className="text-xs md:text-sm font-medium text-gray-700">
                Completion vs Average
              </span>
            </div>
            <div className="text-xs md:text-sm">
              <span
                className={`font-medium ${analytics.completion_percentage > comparative_data.completion_rate ? 'text-green-600' : 'text-red-600'}`}
              >
                {analytics.completion_percentage > comparative_data.completion_rate ? '+' : ''}
                {(analytics.completion_percentage - comparative_data.completion_rate).toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-1">
                vs {comparative_data.completion_rate.toFixed(1)}% average
              </span>
            </div>
          </div>
          {/* Time Spent Comparison */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {analytics.time_spent_minutes > comparative_data.average_time_spent ? (
                <ArrowTrendingUpIcon className="w-4 md:w-5 h-4 md:h-5 text-green-500 mr-2" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 md:w-5 h-4 md:h-5 text-red-500 mr-2" />
              )}
              <span className="text-xs md:text-sm font-medium text-gray-700">
                Time Spent vs Average
              </span>
            </div>
            <div className="text-xs md:text-sm">
              <span
                className={`font-medium ${analytics.time_spent_minutes > comparative_data.average_time_spent ? 'text-green-600' : 'text-red-600'}`}
              >
                {analytics.time_spent_minutes > comparative_data.average_time_spent ? '+' : ''}
                {(analytics.time_spent_minutes - comparative_data.average_time_spent).toFixed(0)}m
              </span>
              <span className="text-gray-500 ml-1">
                vs {comparative_data.average_time_spent.toFixed(0)}m average
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
