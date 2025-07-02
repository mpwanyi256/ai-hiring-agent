'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { RootState, useAppSelector } from '@/store';
import { CandidateBasic, CandidatesListResponse, CandidateStatusFilter } from '@/types/candidates';
import {
  UserGroupIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  ChartBarIcon,
  CalendarIcon,
  SparklesIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon as PendingIcon
} from '@heroicons/react/24/outline';

interface CandidatesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function CandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { success, error: showError } = useToast();
  
  // State for candidates and pagination
  const [candidates, setCandidates] = useState<CandidateBasic[]>([]);
  const [pagination, setPagination] = useState<CandidatesPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    averageScore: 0,
  });
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<CandidateStatusFilter>(
    (searchParams.get('status') as CandidateStatusFilter) || 'all'
  );
  const [jobFilter, setJobFilter] = useState(searchParams.get('job') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Available jobs for filtering
  const [availableJobs, setAvailableJobs] = useState<Array<{id: string, title: string}>>([]);

  // Fetch candidates function
  const fetchCandidates = useCallback(async (page = 1, reset = false) => {
    if (!user?.id) return;

    const loadState = page === 1 ? setIsLoading : setIsLoadingMore;
    loadState(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        profileId: user.id,
        page: page.toString(),
        limit: '10',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (jobFilter) params.append('jobId', jobFilter);

      const response = await fetch(`/api/candidates?${params}`);
      const data: CandidatesListResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch candidates');
      }

      if (reset || page === 1) {
        setCandidates(data.candidates);
      } else {
        setCandidates(prev => [...prev, ...data.candidates]);
      }
      
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch candidates');
    } finally {
      loadState(false);
    }
  }, [user?.id, searchQuery, statusFilter, jobFilter]);

  // Fetch available jobs for filter
  const fetchJobs = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/jobs?profileId=${user.id}&limit=100`);
      const data = await response.json();

      if (data.success) {
        setAvailableJobs(data.jobs.map((job: any) => ({
          id: job.id,
          title: job.title
        })));
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    fetchCandidates(1, true);
    fetchJobs();
  }, [fetchCandidates, fetchJobs]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (jobFilter) params.set('job', jobFilter);
    
    const newUrl = `/dashboard/candidates${params.toString() ? '?' + params.toString() : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, statusFilter, jobFilter, router]);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Filter handlers
  const handleStatusFilter = useCallback((status: CandidateStatusFilter) => {
    setStatusFilter(status);
  }, []);

  const handleJobFilter = useCallback((jobId: string) => {
    setJobFilter(jobId);
  }, []);

  // Load more for infinite scroll
  const loadMore = useCallback(() => {
    if (pagination?.hasMore && !isLoadingMore) {
      fetchCandidates(pagination.page + 1, false);
    }
  }, [pagination, isLoadingMore, fetchCandidates]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

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

  if (!user) return null;

  const hasFilters = searchQuery || statusFilter !== 'all' || jobFilter;

  return (
    <DashboardLayout title="Candidates">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">All Candidates</h1>
              <p className="text-muted-text">
                Manage and review candidates across all your job postings
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link href="/dashboard/jobs/new">
                <Button className="flex items-center">
                  <BriefcaseIcon className="w-4 h-4 mr-2" />
                  Create New Job
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg border border-gray-light p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Total Candidates</p>
                <p className="text-xl font-bold text-text">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-light p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Completed</p>
                <p className="text-xl font-bold text-text">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-light p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <PendingIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">In Progress</p>
                <p className="text-xl font-bold text-text">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-light p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Avg Score</p>
                <p className="text-xl font-bold text-text">
                  {stats.averageScore > 0 ? Math.round(stats.averageScore) : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-light p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-muted-text absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidates by name or email..."
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
              {hasFilters && (
                <span className="ml-2 w-2 h-2 bg-primary rounded-full"></span>
              )}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-light space-y-4">
              {/* Status Filter */}
              <div>
                <span className="text-sm font-medium text-muted-text block mb-2">Status:</span>
                <div className="flex flex-wrap gap-2">
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
                </div>
              </div>

              {/* Job Filter */}
              <div>
                <span className="text-sm font-medium text-muted-text block mb-2">Job:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleJobFilter('')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      jobFilter === '' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-muted-text border-gray-light hover:border-primary'
                    }`}
                  >
                    All Jobs
                  </button>
                  {availableJobs.map(job => (
                    <button
                      key={job.id}
                      onClick={() => handleJobFilter(job.id)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        jobFilter === job.id 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-muted-text border-gray-light hover:border-primary'
                      }`}
                    >
                      {job.title}
                    </button>
                  ))}
                </div>
              </div>
              
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setJobFilter('');
                    setShowFilters(false);
                  }}
                  className="px-3 py-1 text-sm text-accent-red hover:bg-accent-red/10 rounded transition-colors flex items-center"
                >
                  <XMarkIcon className="w-3 h-3 mr-1" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
            <p className="text-accent-red text-sm">{error}</p>
          </div>
        )}

        {/* Candidates List */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-light p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3 text-muted-text">Loading candidates...</span>
            </div>
          </div>
        ) : candidates.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg border border-gray-light p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">
              {hasFilters ? 'No candidates found' : 'No candidates yet'}
            </h3>
            <p className="text-muted-text mb-6">
              {hasFilters 
                ? 'Try adjusting your search criteria or filters' 
                : 'Create job postings and start interviewing candidates to see them here'
              }
            </p>
            {!hasFilters && (
              <Link href="/dashboard/jobs/new">
                <Button>
                  <BriefcaseIcon className="w-4 h-4 mr-2" />
                  Create Your First Job
                </Button>
              </Link>
            )}
          </div>
        ) : (
          // Candidates Grid
          <>
            <div className="bg-white rounded-lg border border-gray-light">
              <div className="p-4 border-b border-gray-light">
                <h3 className="font-medium text-text">Candidates ({pagination?.total || 0})</h3>
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
                            <Link 
                              href={`/dashboard/jobs/${candidate.jobId}`} 
                              className="text-sm text-primary hover:text-primary/80 flex items-center mt-1"
                            >
                              <BriefcaseIcon className="w-3 h-3 mr-1" />
                              {candidate.jobTitle}
                              <ArrowRightIcon className="w-3 h-3 ml-1" />
                            </Link>
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
                          
                          <Link href={`/dashboard/jobs/${candidate.jobId}`}>
                            <Button variant="outline" size="sm" className="flex items-center">
                              <BriefcaseIcon className="w-4 h-4 mr-1" />
                              View Job
                            </Button>
                          </Link>
                          
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

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="mt-8 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-3 text-muted-text">Loading more candidates...</span>
              </div>
            )}

            {/* Load more button (backup for infinite scroll) */}
            {pagination?.hasMore && !isLoadingMore && (
              <div className="mt-8 text-center">
                <Button variant="outline" onClick={loadMore}>
                  Load More Candidates
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 