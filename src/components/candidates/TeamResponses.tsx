'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { selectSelectedCandidate } from '@/store/selectedCandidate/selectedCandidateSelectors';
import { selectUser } from '@/store/auth/authSelectors';
import { selectJobPermissions } from '@/store/jobPermissions/jobPermissionsSelectors';
import {
  UserGroupIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  MinusIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/ToastProvider';

interface TeamResponse {
  id: string;
  candidate_id: string;
  job_id: string;
  user_id: string;
  vote: 'positive' | 'negative' | 'neutral';
  comment: string | null;
  confidence_level: number;
  technical_skills: number | null;
  communication_skills: number | null;
  cultural_fit: number | null;
  created_at: string;
  updated_at: string;
  user_first_name: string | null;
  user_last_name: string | null;
  user_email: string;
  user_role: string;
}

interface TeamResponseSummary {
  total_responses: number;
  positive_votes: number;
  negative_votes: number;
  neutral_votes: number;
  avg_confidence: number;
  avg_technical_skills: number;
  avg_communication_skills: number;
  avg_cultural_fit: number;
}

interface TeamResponseData {
  responses: TeamResponse[];
  summary: TeamResponseSummary | null;
  userResponse: TeamResponse | null;
  canViewResponses: boolean;
  message?: string;
}

export function TeamResponses() {
  const candidate = useAppSelector(selectSelectedCandidate);
  const user = useAppSelector(selectUser);
  const permissions = useAppSelector(selectJobPermissions);
  const [responseData, setResponseData] = useState<TeamResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vote: 'neutral' as 'positive' | 'negative' | 'neutral',
    comment: '',
    confidence_level: 5,
    technical_skills: 5,
    communication_skills: 5,
    cultural_fit: 5,
  });
  const { success, error: showError } = useToast();

  // Check if user can respond (interviewer+ level)
  const userPermission = permissions.find((p) => p.user_id === user?.id);
  const canSubmitResponse =
    userPermission && ['interviewer', 'manager', 'admin'].includes(userPermission.permission_level);

  useEffect(() => {
    if (candidate?.id && candidate?.jobId) {
      fetchTeamResponses();
    }
  }, [candidate?.id, candidate?.jobId]);

  const fetchTeamResponses = async () => {
    if (!candidate?.id || !candidate?.jobId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/candidates/${candidate.id}/team-responses?job_id=${candidate.jobId}`,
      );
      const data = await response.json();

      if (response.ok) {
        setResponseData(data);
        if (data.userResponse) {
          setFormData({
            vote: data.userResponse.vote,
            comment: data.userResponse.comment || '',
            confidence_level: data.userResponse.confidence_level,
            technical_skills: data.userResponse.technical_skills || 5,
            communication_skills: data.userResponse.communication_skills || 5,
            cultural_fit: data.userResponse.cultural_fit || 5,
          });
        }
      } else {
        showError(data.error || 'Failed to fetch team responses');
      }
    } catch (error) {
      console.error('Error fetching team responses:', error);
      showError('Failed to fetch team responses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!candidate?.id || !candidate?.jobId) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/candidates/${candidate.id}/team-responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: candidate.jobId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        success('Response submitted successfully');
        setShowForm(false);
        fetchTeamResponses(); // Refresh data
      } else {
        showError(data.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      showError('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const getVoteIcon = (vote: string) => {
    switch (vote) {
      case 'positive':
        return <HandThumbUpIcon className="w-5 h-5 text-green-600" />;
      case 'negative':
        return <HandThumbDownIcon className="w-5 h-5 text-red-600" />;
      default:
        return <MinusIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getVoteColor = (vote: string) => {
    switch (vote) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!candidate) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No candidate selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading team responses...</p>
      </div>
    );
  }

  if (!responseData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Failed to load team responses</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with submission form toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Team Responses
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Team member evaluations for {candidate.firstName} {candidate.lastName}
          </p>
        </div>
        {canSubmitResponse && (
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            variant={responseData.userResponse ? 'outline' : 'default'}
          >
            {responseData.userResponse ? 'Update Response' : 'Add Response'}
          </Button>
        )}
      </div>

      {/* Response Form */}
      {showForm && canSubmitResponse && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Your Evaluation</h4>
          <div className="space-y-4">
            {/* Vote */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Overall Assessment
              </label>
              <div className="flex space-x-3">
                {[
                  { value: 'positive', label: 'Positive', color: 'green' },
                  { value: 'neutral', label: 'Neutral', color: 'gray' },
                  { value: 'negative', label: 'Negative', color: 'red' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="vote"
                      value={option.value}
                      checked={formData.vote === option.value}
                      onChange={(e) => setFormData({ ...formData, vote: e.target.value as any })}
                      className="mr-2"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Skills Assessment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Technical Skills
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.technical_skills}
                  onChange={(e) =>
                    setFormData({ ...formData, technical_skills: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{formData.technical_skills}/10</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Communication
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.communication_skills}
                  onChange={(e) =>
                    setFormData({ ...formData, communication_skills: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{formData.communication_skills}/10</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cultural Fit</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.cultural_fit}
                  onChange={(e) =>
                    setFormData({ ...formData, cultural_fit: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{formData.cultural_fit}/10</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Confidence Level
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.confidence_level}
                  onChange={(e) =>
                    setFormData({ ...formData, confidence_level: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{formData.confidence_level}/10</span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Comments</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Add your thoughts about this candidate..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={3}
              />
            </div>

            {/* Submit */}
            <div className="flex items-center space-x-2">
              <Button onClick={handleSubmitResponse} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Response'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on access */}
      {!responseData.canViewResponses ? (
        <div className="text-center py-8">
          <ChatBubbleLeftIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Submit Your Response First</h4>
          <p className="text-sm text-gray-500 mb-4">
            {responseData.message ||
              'You need to submit your evaluation before viewing team responses'}
          </p>
          {canSubmitResponse && (
            <Button onClick={() => setShowForm(true)}>Add Your Response</Button>
          )}
        </div>
      ) : (
        <>
          {/* Summary */}
          {responseData.summary && responseData.summary.total_responses > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Team Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {responseData.summary.positive_votes}
                  </div>
                  <div className="text-xs text-gray-500">Positive</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {responseData.summary.neutral_votes}
                  </div>
                  <div className="text-xs text-gray-500">Neutral</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {responseData.summary.negative_votes}
                  </div>
                  <div className="text-xs text-gray-500">Negative</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {responseData.summary.avg_confidence?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">Avg Confidence</div>
                </div>
              </div>
            </div>
          )}

          {/* Individual Responses */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900">
                Team Responses ({responseData.responses.length})
              </h4>
            </div>

            {responseData.responses.length === 0 ? (
              <div className="p-8 text-center">
                <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-sm font-medium text-gray-900 mb-1">No responses yet</h4>
                <p className="text-xs text-gray-500">Be the first to evaluate this candidate</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {responseData.responses.map((response) => (
                  <div key={response.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {response.user_first_name?.[0] || response.user_email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {response.user_first_name && response.user_last_name
                              ? `${response.user_first_name} ${response.user_last_name}`
                              : response.user_email}
                          </p>
                          <p className="text-xs text-gray-500">{response.user_role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getVoteColor(response.vote)}`}
                        >
                          {getVoteIcon(response.vote)}
                          <span className="ml-1 capitalize">{response.vote}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(response.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {response.comment && (
                      <p className="text-sm text-gray-700 mb-2">{response.comment}</p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Confidence: {response.confidence_level}/10</span>
                      {response.technical_skills && (
                        <span>Technical: {response.technical_skills}/10</span>
                      )}
                      {response.communication_skills && (
                        <span>Communication: {response.communication_skills}/10</span>
                      )}
                      {response.cultural_fit && <span>Culture: {response.cultural_fit}/10</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
