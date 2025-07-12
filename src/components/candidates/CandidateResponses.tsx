'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState, useAppSelector } from '@/store';
import { fetchCandidateResponses } from '@/store/candidates/candidatesThunks';
import { ChatBubbleLeftRightIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { selectSelectedCandidate } from '@/store/selectedCandidate/selectedCandidateSelectors';

type TabType = 'responses' | 'analytics';

export default function CandidateResponses() {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<TabType>('responses');

  const candidate = useAppSelector(selectSelectedCandidate);
  const { candidateResponses } = useSelector((state: RootState) => state.candidates);
  const candidateData = candidate && candidateResponses[candidate.id];

  const isLoading = candidateData?.isLoading || false;
  const responses = candidateData?.responses || [];
  const error = candidateData?.error;

  useEffect(() => {
    if (candidate) {
      dispatch(fetchCandidateResponses({ candidateId: candidate.id }));
    }
  }, [dispatch, candidate]);

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    {
      id: 'responses' as TabType,
      name: 'Interview Responses',
      icon: ChatBubbleLeftRightIcon,
      count: responses.length,
    },
    {
      id: 'analytics' as TabType,
      name: 'Analytics',
      icon: ChartBarIcon,
      count: null,
    },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mr-3"></div>
          <span className="text-gray-600">Loading responses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Error loading responses</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return <div>Candidate not found</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {candidate.name}&apos;s Interview Data
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {responses.length} response{responses.length !== 1 ? 's' : ''} recorded
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
                {tab.count !== null && (
                  <span className="bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'responses' && (
          <div className="space-y-6">
            {responses.length === 0 ? (
              <div className="text-center py-8">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
                <p className="text-gray-600">
                  This candidate hasn&apos;t completed the interview questions yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {responses.map((response, index) => (
                  <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded">
                          Q{response.orderIndex || index + 1}
                        </span>
                        {/* <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {response.questionType}
                        </span> */}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-3 h-3" />
                          <span>{formatResponseTime(response.responseTime || 0)}</span>
                        </div>
                        <span>{formatDate(response.createdAt)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                        <p className="text-gray-700 text-sm">{response.question}</p>
                      </div>

                      <div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">
                            {response.responseText}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Candidate Analytics</h3>
              <p className="text-gray-600">
                A detailed insight into the candidate&apos;s interview responses per question.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Response Time</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {responses.length > 0
                    ? formatResponseTime(
                        responses.reduce((acc, r) => acc + (r.responseTime || 0), 0) /
                          responses.length,
                      )
                    : 'No data'}
                </p>
                <p className="text-xs text-blue-700 mt-1">Average per question</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Completion</h4>
                <p className="text-2xl font-bold text-green-600">
                  {responses.length > 0 ? '100%' : 'No data'}
                </p>
                <p className="text-xs text-green-700 mt-1">Questions answered</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">Last Activity</h4>
                <p className="text-sm font-medium text-purple-600">
                  {responses.length > 0
                    ? formatDate(responses[responses.length - 1].createdAt)
                    : 'No data'}
                </p>
                <p className="text-xs text-purple-700 mt-1">Most recent response</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
