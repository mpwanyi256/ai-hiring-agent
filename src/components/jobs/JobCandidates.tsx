'use client';

import { useState, useEffect, useCallback } from 'react';
import { CandidateBasic, CandidatesListResponse, CandidateStatusFilter } from '@/types/candidates';
import { useToast } from '@/components/providers/ToastProvider';
import { RootState, useAppSelector } from '@/store';
import Button from '@/components/ui/Button';
import {
  UserGroupIcon,
  EyeIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  StarIcon,
  ChartBarIcon,
  CalendarIcon,
  SparklesIcon,
  TrophyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CurrentJob } from '@/types';

interface JobCandidatesProps {
  job: CurrentJob;
}

export default function JobCandidates({ job }: JobCandidatesProps) {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { success, error: showError } = useToast();
  
  const [candidates, setCandidates] = useState<CandidateBasic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    averageScore: 0,
  });

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CandidateStatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchCandidates = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        profileId: user.id,
        jobId: job.id,
        page: '1',
        limit: '50', // Show all candidates for a job
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/candidates?${params}`);
      const data: CandidatesListResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch candidates');
      }

      setCandidates(data.candidates);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch candidates');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, job.id, searchQuery, statusFilter]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: CandidateStatusFilter) => {
    setStatusFilter(status);
  };

  const copyInterviewLink = async () => {
    const link = job.interviewLink || `${window.location.origin}/interview/${job.interviewToken}`;
    try {
      await navigator.clipboard.writeText(link);
      success('Interview link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      showError('Failed to copy link to clipboard');
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
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-light p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3 text-muted-text">Loading candidates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-light p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Error Loading Candidates</h3>
          <p className="text-muted-text mb-4">{error}</p>
          <Button onClick={fetchCandidates} variant="outline">Try Again</Button>
        </div>
      </div>
    );
  }

  if (candidates.length === 0 && searchQuery === '' && statusFilter === 'all') {
    return (
      <div className="space-y-6">
        {/* Stats Overview - Always show */}
        <div className="bg-white rounded-lg border border-gray-light p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Candidate Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-text">{stats.total}</div>
              <div className="text-sm text-muted-text">Total Applications</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-muted-text">In Progress</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-text">Completed</div>
            </div>
            <div className="bg-primary/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">
                {stats.averageScore > 0 ? Math.round(stats.averageScore) : '-'}
              </div>
              <div className="text-sm text-muted-text">Avg Score</div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg border border-gray-light p-8 text-center">
          <UserGroupIcon className="w-12 h-12 text-muted-text mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">No Candidates Yet</h3>
          <p className="text-muted-text mb-6">
            Once candidates complete interviews for this position, they&apos;ll appear here.
          </p>
          
          {job.status === 'draft' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-700 text-sm">
                <CheckBadgeIcon className="w-4 h-4 inline mr-1" />
                Start interviewing to accept candidate applications for this job.
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" className="flex items-center" onClick={copyInterviewLink}>
              <EyeIcon className="w-4 h-4 mr-2" />
              Copy Interview Link
            </Button>
            {job.interviewLink && (
              <Button className="flex items-center">
                Share Interview Link
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Candidates Stats */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Candidate Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-text">{stats.total}</div>
            <div className="text-sm text-muted-text">Total Applications</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-text">In Progress</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-text">Completed</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">
              {stats.averageScore > 0 ? Math.round(stats.averageScore) : '-'}
            </div>
            <div className="text-sm text-muted-text">Avg Score</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-light p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-muted-text absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
            {statusFilter !== 'all' && (
              <span className="ml-2 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </Button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-light">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-text">Status:</span>
              {(['all', 'completed', 'in_progress'] as CandidateStatusFilter[]).map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    statusFilter === status 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-white text-muted-text border-gray-light hover:border-primary'
                  }`}
                >
                  {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : 'Completed'}
                </button>
              ))}
              
              {statusFilter !== 'all' && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setShowFilters(false);
                  }}
                  className="px-2 py-1 text-sm text-accent-red hover:bg-accent-red/10 rounded transition-colors flex items-center"
                >
                  <XMarkIcon className="w-3 h-3 mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Candidates List */}
      {candidates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-light p-8 text-center">
          <UserGroupIcon className="w-12 h-12 text-muted-text mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">No candidates found</h3>
          <p className="text-muted-text">Try adjusting your search criteria or filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-light">
          <div className="p-4 border-b border-gray-light">
            <h3 className="font-medium text-text">Candidates ({candidates.length})</h3>
          </div>
          
          <div className="divide-y divide-gray-light">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Candidate Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-medium text-text">{candidate.fullName}</h4>
                        {candidate.email && (
                          <p className="text-sm text-muted-text">{candidate.email}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        {candidate.evaluation && (
                          <>
                            <div className="flex items-center space-x-2">
                              <span className={`text-lg font-bold ${getScoreColor(candidate.evaluation.score)}`}>
                                {candidate.evaluation.score}/100
                              </span>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(candidate.evaluation.recommendation)}`}>
                                {getRecommendationLabel(candidate.evaluation.recommendation)}
                              </div>
                            </div>
                          </>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          candidate.isCompleted 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {candidate.isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </div>

                    {/* Progress and Stats */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-text mb-4">
                      <div className="flex items-center space-x-1">
                        <ChartBarIcon className="w-4 h-4" />
                        <span>Progress: {candidate.completionPercentage}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{candidate.responseCount} responses</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(candidate.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* AI Evaluation Summary */}
                    {candidate.evaluation && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-text mb-2">{candidate.evaluation.summary}</p>
                        {candidate.evaluation.strengths.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {candidate.evaluation.strengths.slice(0, 3).map((strength, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                {strength}
                              </span>
                            ))}
                            {candidate.evaluation.strengths.length > 3 && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                +{candidate.evaluation.strengths.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      
                      {candidate.evaluation && (
                        <Button variant="outline" size="sm" className="flex items-center">
                          <SparklesIcon className="w-4 h-4 mr-1" />
                          View Evaluation
                        </Button>
                      )}
                      
                      {candidate.evaluation?.recommendation === 'strong_yes' && (
                        <Button size="sm" className="flex items-center">
                          <TrophyIcon className="w-4 h-4 mr-1" />
                          Shortlist
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 