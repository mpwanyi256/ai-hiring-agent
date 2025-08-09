'use client';

import React, { useState, useEffect } from 'react';
import { apiError } from '@/lib/notification';
import {
  ChartBarIcon,
  UserGroupIcon,
  TrophyIcon,
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
import { MetricCard } from './analytics/MetricCard';
import { ComparisonRow } from './analytics/ComparisonRow';
import { TeamSummary } from './analytics/TeamSummary';
import { AIAssessment } from './analytics/AIAssessment';

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

  if (!analyticsData || !analyticsData.analytics || !analyticsData.comparative_data) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
            <p className="text-gray-500">
              Analytics will appear once interview and evaluation are completed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { analytics, response_analytics, comparative_data, ai_assessment, team_summary } =
    analyticsData as any;

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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Candidate Insights</h2>
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-4 md:w-5 h-4 md:h-5 text-primary" />
            <span className="text-xs md:text-sm text-gray-500">Decision support</span>
          </div>
        </div>
        <p className="text-xs md:text-sm text-gray-600">
          Evidence-based overview for {candidate?.firstName}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Overall Score"
          value={`${analytics.overall_score}%`}
          icon={<TrophyIcon className="w-4 md:w-5 h-4 md:h-5 text-yellow-500" />}
          progressPercent={analytics.overall_score}
          valueClassName={getScoreColor(analytics.overall_score)}
          subtitle={`Rank #${analytics.rank_in_job} of ${analytics.total_candidates_in_job}`}
        />
        <MetricCard
          title="Completion Rate"
          value={`${analytics.completion_percentage}%`}
          icon={<CheckCircleIcon className="w-4 md:w-5 h-4 md:h-5 text-green-500" />}
          progressPercent={analytics.completion_percentage}
          valueClassName={getScoreColor(analytics.completion_percentage)}
          subtitle={`${analytics.total_responses} of ${analytics.total_questions}`}
        />
        <MetricCard
          title="Engagement"
          value={analytics.engagement_level}
          icon={<UserGroupIcon className="w-4 md:w-5 h-4 md:h-5 text-blue-500" />}
          valueClassName={`capitalize ${getEngagementColor(analytics.engagement_level).split(' ')[0]}`}
          subtitle={`${analytics.time_spent_minutes} minutes spent`}
        />
        <MetricCard
          title="Percentile"
          value={analytics.percentile_rank}
          icon={<TagIcon className="w-4 md:w-5 h-4 md:h-5 text-purple-500" />}
          valueClassName={getScoreColor(analytics.percentile_rank)}
          subtitle={`Top ${Math.max(0, 100 - (analytics.percentile_rank || 0))}% of candidates`}
        />
      </div>

      {/* Score Breakdown */}
      <div className="flex flex-col gap-4 bg-white rounded-lg border border-gray-200 p-4 md:p-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Score Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CpuChipIcon className="w-4 md:w-5 h-4 md:h-5 text-blue-500 mr-2" />
              <span className="text-xs md:text-sm font-medium text-gray-700">Interview Score</span>
            </div>
            <div
              className={`text-2xl md:text-3xl font-bold ${getResumeScoreColor(analytics.interview_score)}`}
            >
              {analytics.interview_score}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2 mt-2">
              <div
                className={`${getInterviewScoreColor(analytics.interview_score)} h-1.5 md:h-2 rounded-full`}
                style={{ width: `${analytics.interview_score}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <DocumentTextIcon className="w-4 md:w-5 h-4 md:h-5 text-green-500 mr-2" />
              <span className="text-xs md:text-sm font-medium text-gray-700">Resume Match</span>
            </div>
            <div
              className={`text-2xl md:text-3xl font-bold ${getScoreColor(analytics.resume_score || 0)}`}
            >
              {analytics.resume_score}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2 mt-2">
              <div
                className="bg-green-500 h-1.5 md:h-2 rounded-full"
                style={{ width: `${analytics.resume_score || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Response Analytics */}
      {response_analytics && response_analytics.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col mb-1">
            <h3 className="text-lg font-semibold text-gray-900 mr-2">Response Analytics</h3>
            <span className="flex bg-primary/10 rounded-lg p-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-blue-400 mr-1" />
              <span className="text-xs text-gray-700">
                Quality % reflects how well the answer meets the question requirements considering
                estimated vs actual response time.
              </span>
            </span>
          </div>
          <div className="space-y-4 mt-2">
            {response_analytics.map((response: any, index: number) => (
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
        </div>
        <div className="space-y-4 mt-2">
          <ComparisonRow
            label="Score vs Average"
            value={analytics.overall_score}
            baseline={comparative_data.average_score}
          />
          <ComparisonRow
            label="Completion vs Average"
            value={analytics.completion_percentage}
            baseline={comparative_data.completion_rate}
          />
          <ComparisonRow
            label="Time Spent vs Average"
            value={analytics.time_spent_minutes}
            baseline={comparative_data.average_time_spent}
            unit="m"
          />
        </div>
      </div>

      {/* Team Summary */}
      <TeamSummary teamSummary={team_summary} />

      {/* AI Assessment */}
      <AIAssessment ai={ai_assessment || null} />
    </div>
  );
}
