import React, { useEffect, useState } from 'react';
import { CandidateWithEvaluation } from '@/types/candidates';
import InterviewCard from '../dashboard/InterviewCard';
import Button from '../ui/Button';
import { fetchApplicationEvents } from '@/store/interviews/interviewsThunks';
import { clearApplicationEvents } from '@/store/interviews/interviewsSlice';
import { useAppSelector } from '@/store';
import { useAppDispatch } from '@/store';
import {
  Loader2,
  Users,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileText,
  Target,
  TrendingUp,
  Star,
  Clock,
  Award,
  CheckCircle,
  AlertTriangle,
  Brain,
  Lightbulb,
} from 'lucide-react';
import { selectApplicationEvents } from '@/store/interviews/interviewsSelectors';

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

interface ResumeEvaluation {
  id: string;
  score: number;
  summary: string;
  strengths: string[];
  redFlags: string[];
  recommendation: string;
  skillsAssessment: Record<string, any>;
  createdAt: string;
}

const GeneralTab: React.FC<{
  candidate: CandidateWithEvaluation;
  onScheduleEvent?: () => void;
}> = ({ candidate, onScheduleEvent }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [teamSummaryLoading, setTeamSummaryLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [teamSummary, setTeamSummary] = useState<TeamResponseSummary | null>(null);
  const [resumeEvaluation, setResumeEvaluation] = useState<ResumeEvaluation | null>(null);
  const applicationEvents = useAppSelector(selectApplicationEvents);

  useEffect(() => {
    setIsLoading(true);
    dispatch(fetchApplicationEvents(candidate.id)).finally(() => {
      setIsLoading(false);
    });

    // Fetch team response summary
    fetchTeamResponseSummary();

    // Fetch resume evaluation
    fetchResumeEvaluation();

    return () => {
      dispatch(clearApplicationEvents());
    };
  }, [candidate.id, dispatch]);

  const fetchTeamResponseSummary = async () => {
    if (!candidate.jobId) return;

    setTeamSummaryLoading(true);
    try {
      const response = await fetch(
        `/api/candidates/${candidate.id}/team-responses?job_id=${candidate.jobId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setTeamSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch team summary:', error);
    }
    setTeamSummaryLoading(false);
  };

  const fetchResumeEvaluation = async () => {
    if (!candidate.jobId) return;

    setResumeLoading(true);
    try {
      const response = await fetch(
        `/api/evaluation/resume?candidateId=${candidate.id}&jobId=${candidate.jobId}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.evaluation) {
          setResumeEvaluation(data.evaluation);
        }
      }
    } catch (error) {
      console.error('Failed to fetch resume evaluation:', error);
    }
    setResumeLoading(false);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getVotePercentage = (votes: number, total: number): number => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-350px)]">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[calc(100vh-350px)] overflow-y-auto">
      {/* Candidate Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Application Progress</p>
              <p className="text-2xl font-bold text-blue-900">{candidate.progress || 0}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 w-full bg-blue-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${candidate.progress || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Questions Answered</p>
              <p className="text-2xl font-bold text-green-900">{candidate.responses || 0}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-green-500" />
          </div>
          {candidate.totalSteps && (
            <p className="text-xs text-green-600 mt-1">of {candidate.totalSteps} total questions</p>
          )}
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Status</p>
              <p className="text-lg font-semibold text-purple-900 capitalize">
                {candidate.status?.replace('_', ' ') || 'Under Review'}
              </p>
            </div>
            <Award className="h-8 w-8 text-purple-500" />
          </div>
          <div className="flex items-center mt-1">
            {candidate.isCompleted ? (
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-500 mr-1" />
            )}
            <p className="text-xs text-purple-600">
              {candidate.isCompleted ? 'Completed' : 'In Progress'}
            </p>
          </div>
        </div>
      </div>

      {/* Team Response Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Team Collaboration</h3>
          </div>
          {teamSummaryLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>

        {teamSummary && teamSummary.total_responses > 0 ? (
          <div className="space-y-4">
            {/* Vote Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Positive</span>
                </div>
                <p className="text-xl font-bold text-green-900">{teamSummary.positive_votes}</p>
                <p className="text-xs text-green-600">
                  {getVotePercentage(teamSummary.positive_votes, teamSummary.total_responses)}%
                </p>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Neutral</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{teamSummary.neutral_votes}</p>
                <p className="text-xs text-gray-600">
                  {getVotePercentage(teamSummary.neutral_votes, teamSummary.total_responses)}%
                </p>
              </div>

              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Negative</span>
                </div>
                <p className="text-xl font-bold text-red-900">{teamSummary.negative_votes}</p>
                <p className="text-xs text-red-600">
                  {getVotePercentage(teamSummary.negative_votes, teamSummary.total_responses)}%
                </p>
              </div>
            </div>

            {/* Skills Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-1">Technical Skills</p>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(teamSummary.avg_technical_skills * 10)}`}
                >
                  <Brain className="h-4 w-4 mr-1" />
                  {teamSummary.avg_technical_skills.toFixed(1)}/10
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-1">Communication</p>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(teamSummary.avg_communication_skills * 10)}`}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {teamSummary.avg_communication_skills.toFixed(1)}/10
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-1">Cultural Fit</p>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(teamSummary.avg_cultural_fit * 10)}`}
                >
                  <Star className="h-4 w-4 mr-1" />
                  {teamSummary.avg_cultural_fit.toFixed(1)}/10
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>{teamSummary.total_responses}</strong> team member
                {teamSummary.total_responses !== 1 ? 's' : ''} have reviewed this candidate
                {teamSummary.avg_confidence > 0 && (
                  <span>
                    {' '}
                    with an average confidence of{' '}
                    <strong>{teamSummary.avg_confidence.toFixed(1)}/10</strong>
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No team responses yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Team members will be able to vote and provide feedback here
            </p>
          </div>
        )}
      </div>

      {/* Resume Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Resume Analysis</h3>
          </div>
          {resumeLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>

        {resumeEvaluation ? (
          <div className="space-y-4">
            {/* Resume Score */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Overall Resume Score</p>
                <p className="text-xs text-gray-500 mt-1">
                  Analyzed on {new Date(resumeEvaluation.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div
                className={`text-2xl font-bold px-4 py-2 rounded-lg ${getScoreColor(resumeEvaluation.score)}`}
              >
                {resumeEvaluation.score}%
              </div>
            </div>

            {/* Summary */}
            {resumeEvaluation.summary && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">AI Summary</h4>
                    <p className="text-sm text-blue-800">{resumeEvaluation.summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Strengths and Red Flags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumeEvaluation.strengths && resumeEvaluation.strengths.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-green-900 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Key Strengths
                  </h4>
                  <ul className="space-y-1">
                    {resumeEvaluation.strengths.slice(0, 3).map((strength, index) => (
                      <li
                        key={index}
                        className="text-sm text-green-800 bg-green-50 px-3 py-2 rounded border border-green-200"
                      >
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resumeEvaluation.redFlags && resumeEvaluation.redFlags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-900 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Areas of Concern
                  </h4>
                  <ul className="space-y-1">
                    {resumeEvaluation.redFlags.slice(0, 3).map((flag, index) => (
                      <li
                        key={index}
                        className="text-sm text-red-800 bg-red-50 px-3 py-2 rounded border border-red-200"
                      >
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendation */}
            {resumeEvaluation.recommendation && (
              <div
                className={`p-3 rounded-lg border ${
                  resumeEvaluation.recommendation === 'yes' ||
                  resumeEvaluation.recommendation === 'proceed'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <p className="text-sm font-medium">
                  <Target className="h-4 w-4 inline mr-1" />
                  Recommendation:
                  <span
                    className={`ml-1 ${
                      resumeEvaluation.recommendation === 'yes' ||
                      resumeEvaluation.recommendation === 'proceed'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {resumeEvaluation.recommendation === 'yes' ||
                    resumeEvaluation.recommendation === 'proceed'
                      ? 'Proceed to Interview'
                      : 'Needs Review'}
                  </span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No resume analysis available</p>
            <p className="text-xs text-gray-400 mt-1">
              Resume evaluation will appear here once processed
            </p>
          </div>
        )}
      </div>

      {/* Application Events */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Application Events</h3>
          {onScheduleEvent && (
            <Button variant="primary" size="sm" onClick={onScheduleEvent}>
              Schedule Event
            </Button>
          )}
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {applicationEvents.length > 0 ? (
            applicationEvents.map((event) => (
              <InterviewCard
                key={event.id}
                interview={{
                  interview_id: event.id,
                  candidate_id: candidate.id,
                  interview_date: event.date,
                  interview_time: event.time,
                  interview_status: event.status,
                  candidate_first_name: candidate.firstName,
                  candidate_last_name: candidate.lastName,
                  candidate_email: candidate.email,
                  job_title: event.jobTitle,
                  event_summary: event.eventSummary,
                  meet_link: event.meetingLink || undefined,
                  job_id: event.jobId,
                }}
              />
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No events scheduled</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
