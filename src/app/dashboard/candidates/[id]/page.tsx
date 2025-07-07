'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { RootState, useAppSelector } from '@/store';
import { CandidateDetailed, CandidateStatusFilter } from '@/types/candidates';
import {
  ArrowLeftIcon,
  EyeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  TrophyIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  StarIcon,
  FlagIcon,
  DocumentIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: UserIcon },
  { id: 'responses', label: 'Interview Responses', icon: DocumentTextIcon },
  { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
];

export default function CandidateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { success, error: showError } = useToast();
  
  const [candidate, setCandidate] = useState<CandidateDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const candidateId = params.id as string;

  useEffect(() => {
    if (!user?.id || !candidateId) return;
    fetchCandidateDetails();
  }, [user?.id, candidateId]);

  const fetchCandidateDetails = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/candidates/${candidateId}?profileId=${user.id}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch candidate details');
      }

      setCandidate(data.candidate);
    } catch (err) {
      console.error('Error fetching candidate details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch candidate details');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCandidateStatus = async (status: string) => {
    if (!candidate) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/candidates/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      setCandidate(prev => prev ? { ...prev, status } : null);
      success('Candidate status updated successfully');
    } catch (err) {
      console.error('Error updating candidate status:', err);
      showError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_yes': return 'text-green-700 bg-green-100';
      case 'yes': return 'text-green-600 bg-green-50';
      case 'maybe': return 'text-yellow-600 bg-yellow-50';
      case 'no': return 'text-red-600 bg-red-50';
      case 'strong_no': return 'text-red-700 bg-red-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_yes': return 'Strong Yes';
      case 'yes': return 'Yes';
      case 'maybe': return 'Maybe';
      case 'no': return 'No';
      case 'strong_no': return 'Strong No';
      default: return 'Pending';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <DashboardLayout title="Candidate Details">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-light p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3 text-muted-text">Loading candidate details...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Candidate Details">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-light p-8">
            <div className="text-center">
              <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">Error Loading Candidate</h3>
              <p className="text-muted-text mb-4">{error}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!candidate) {
    return (
      <DashboardLayout title="Candidate Details">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-light p-8">
            <div className="text-center">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">Candidate Not Found</h3>
              <p className="text-muted-text mb-4">The candidate you're looking for doesn't exist or you don't have access to it.</p>
              <Button onClick={() => router.back()}>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${candidate.fullName} - Candidate Details`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Candidates
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-text">{candidate.fullName}</h1>
                <p className="text-muted-text">
                  Candidate for {candidate.job.title}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {candidate.evaluation && (
                <div className="flex items-center space-x-2">
                  <span className={`text-xl font-bold ${getScoreColor(candidate.evaluation.score)}`}>
                    {candidate.evaluation.score}/100
                  </span>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(candidate.evaluation.recommendation)}`}>
                    {getRecommendationLabel(candidate.evaluation.recommendation)}
                  </div>
                </div>
              )}
              
              <span className={`px-3 py-1 text-sm rounded-full ${
                candidate.isCompleted 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {candidate.isCompleted ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-light mb-6">
          <div className="border-b border-gray-light">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-text hover:text-text hover:border-gray-light'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Candidate Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-text mb-3">Candidate Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4 text-muted-text" />
                        <span className="text-muted-text">Name:</span>
                        <span className="font-medium">{candidate.fullName}</span>
                      </div>
                      {candidate.email && (
                        <div className="flex items-center space-x-2">
                          <EnvelopeIcon className="w-4 h-4 text-muted-text" />
                          <span className="text-muted-text">Email:</span>
                          <span className="font-medium">{candidate.email}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-muted-text" />
                        <span className="text-muted-text">Applied:</span>
                        <span className="font-medium">
                          {new Date(candidate.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BriefcaseIcon className="w-4 h-4 text-muted-text" />
                        <span className="text-muted-text">Job:</span>
                        <span className="font-medium">{candidate.job.title}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-text mb-3">Interview Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="w-4 h-4 text-muted-text" />
                        <span className="text-muted-text">Questions:</span>
                        <span className="font-medium">
                          {candidate.stats.answeredQuestions}/{candidate.stats.totalQuestions}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-muted-text" />
                        <span className="text-muted-text">Total Time:</span>
                        <span className="font-medium">
                          {formatDuration(candidate.stats.totalInterviewTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-muted-text" />
                        <span className="text-muted-text">Avg Response:</span>
                        <span className="font-medium">
                          {formatDuration(candidate.stats.averageResponseTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-muted-text" />
                        <span className="text-muted-text">Completion:</span>
                        <span className="font-medium">{candidate.stats.completionPercentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Evaluation Summary */}
                {candidate.evaluation && (
                  <div className="bg-white border border-gray-light rounded-lg p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <SparklesIcon className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-medium text-text">AI Evaluation Summary</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className={`text-3xl font-bold mb-2 ${getScoreColor(candidate.evaluation.score)}`}>
                          {candidate.evaluation.score}/100
                        </div>
                        <div className="text-sm text-muted-text">Overall Score</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`px-4 py-2 rounded-full text-sm font-medium inline-block ${getRecommendationColor(candidate.evaluation.recommendation)}`}>
                          {getRecommendationLabel(candidate.evaluation.recommendation)}
                        </div>
                        <div className="text-sm text-muted-text mt-2">Recommendation</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-2 text-text">
                          {candidate.evaluation.strengths.length}
                        </div>
                        <div className="text-sm text-muted-text">Key Strengths</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-text mb-2">Summary</h4>
                        <p className="text-muted-text text-sm leading-relaxed">
                          {candidate.evaluation.summary}
                        </p>
                      </div>

                      {candidate.evaluation.strengths.length > 0 && (
                        <div>
                          <h4 className="font-medium text-text mb-2 flex items-center">
                            <StarIcon className="w-4 h-4 mr-2 text-green-600" />
                            Key Strengths
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {candidate.evaluation.strengths.map((strength, index) => (
                              <span key={index} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {candidate.evaluation.redFlags.length > 0 && (
                        <div>
                          <h4 className="font-medium text-text mb-2 flex items-center">
                            <FlagIcon className="w-4 h-4 mr-2 text-red-600" />
                            Areas of Concern
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {candidate.evaluation.redFlags.map((flag, index) => (
                              <span key={index} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-text mb-3">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="flex items-center">
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Full Interview
                    </Button>
                    
                    {candidate.evaluation?.recommendation === 'strong_yes' && (
                      <Button className="flex items-center">
                        <TrophyIcon className="w-4 h-4 mr-2" />
                        Shortlist Candidate
                      </Button>
                    )}
                    
                    <Button variant="outline" className="flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    
                    <Link href={`/dashboard/jobs/${candidate.jobId}`}>
                      <Button variant="outline" className="flex items-center">
                        <BriefcaseIcon className="w-4 h-4 mr-2" />
                        View Job Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Responses Tab */}
            {activeTab === 'responses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-text">Interview Responses</h3>
                  <div className="text-sm text-muted-text">
                    {candidate.responses.length} responses
                  </div>
                </div>

                {candidate.responses.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-text">No responses recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {candidate.responses.map((response, index) => (
                      <div key={response.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-text">Question {index + 1}</h4>
                          <div className="text-sm text-muted-text">
                            {formatDuration(response.responseTime)}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium text-muted-text mb-1">Question:</div>
                            <p className="text-text">{response.question}</p>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium text-muted-text mb-1">Answer:</div>
                            <p className="text-text whitespace-pre-wrap">{response.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-text">Interview Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-text mb-1">
                      {candidate.stats.totalQuestions}
                    </div>
                    <div className="text-sm text-muted-text">Total Questions</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-text mb-1">
                      {candidate.stats.answeredQuestions}
                    </div>
                    <div className="text-sm text-muted-text">Answered</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-text mb-1">
                      {formatDuration(candidate.stats.totalInterviewTime)}
                    </div>
                    <div className="text-sm text-muted-text">Total Time</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-text mb-1">
                      {formatDuration(candidate.stats.averageResponseTime)}
                    </div>
                    <div className="text-sm text-muted-text">Avg Response</div>
                  </div>
                </div>

                {candidate.evaluation && (
                  <div className="bg-white border border-gray-light rounded-lg p-6">
                    <h4 className="font-medium text-text mb-4">Detailed Scoring</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-text">Overall Score</span>
                          <span className="font-medium">{candidate.evaluation.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getScoreColor(candidate.evaluation.score).replace('text-', 'bg-')}`}
                            style={{ width: `${candidate.evaluation.score}%` }}
                          ></div>
                        </div>
                      </div>

                      {candidate.evaluation.skillsAssessment && (
                        <div>
                          <h5 className="font-medium text-text mb-3">Skills Assessment</h5>
                          <div className="space-y-2">
                            {Object.entries(candidate.evaluation.skillsAssessment).map(([skill, score]) => (
                              <div key={skill}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-text">{skill}</span>
                                  <span className="font-medium">{score}/10</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-primary h-1.5 rounded-full"
                                    style={{ width: `${(score as number) * 10}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {candidate.evaluation.traitsAssessment && (
                        <div>
                          <h5 className="font-medium text-text mb-3">Traits Assessment</h5>
                          <div className="space-y-2">
                            {Object.entries(candidate.evaluation.traitsAssessment).map(([trait, score]) => (
                              <div key={trait}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-text">{trait}</span>
                                  <span className="font-medium">{score}/10</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-primary h-1.5 rounded-full"
                                    style={{ width: `${(score as number) * 10}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 