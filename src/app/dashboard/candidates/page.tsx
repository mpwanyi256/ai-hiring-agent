'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import InterviewScheduler from '@/components/candidates/InterviewScheduler';
import { RootState, useAppDispatch, useAppSelector } from '@/store';
import { CandidateList, CandidateStatusFilter } from '@/types/candidates';
import {
  UserGroupIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  SparklesIcon,
  TrophyIcon,
  BriefcaseIcon,
  XCircleIcon,
  DocumentIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { fetchJobCandidates } from '@/store/candidates/candidatesThunks';
import {
  selectCandidatesList,
  selectCandidatesLoading,
  selectCandidatesPagination,
  selectCandidateStats,
} from '@/store/candidates/candidatesSelectors';
import { apiError } from '@/lib/notification';

export default function CandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { success, error: showError } = useToast();
  const dispatch = useAppDispatch();
  const candidates = useAppSelector(selectCandidatesList);
  const isLoading = useAppSelector(selectCandidatesLoading);
  const pagination = useAppSelector(selectCandidatesPagination);
  const stats = useAppSelector(selectCandidateStats);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<CandidateStatusFilter>(
    (searchParams.get('status') as CandidateStatusFilter) || 'all',
  );
  const [jobFilter, setJobFilter] = useState(searchParams.get('job') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters
  const [dateRange, setDateRange] = useState({
    start: searchParams.get('startDate') || '',
    end: searchParams.get('endDate') || '',
  });
  const [scoreRange, setScoreRange] = useState({
    min: searchParams.get('minScore') || '',
    max: searchParams.get('maxScore') || '',
  });
  const [recommendationFilter, setRecommendationFilter] = useState(
    searchParams.get('recommendation') || 'all',
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  );

  // Bulk operations state
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);

  // Interview scheduling state
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedCandidateForScheduling, setSelectedCandidateForScheduling] =
    useState<CandidateList | null>(null);

  // Available jobs for filtering
  const [availableJobs, setAvailableJobs] = useState<Array<{ id: string; title: string }>>([]);

  // Fetch candidates function
  const fetchCandidates = useCallback(
    async (page = 1) => {
      if (!user?.id) return;
      setError(null);

      try {
        const params = new URLSearchParams({
          profileId: user.id,
          page: page.toString(),
          limit: '10',
          sortBy,
          sortOrder,
        });

        if (searchQuery) params.append('search', searchQuery);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (jobFilter) params.append('jobId', jobFilter);
        if (dateRange.start) params.append('startDate', dateRange.start);
        if (dateRange.end) params.append('endDate', dateRange.end);
        if (scoreRange.min) params.append('minScore', scoreRange.min);
        if (scoreRange.max) params.append('maxScore', scoreRange.max);
        if (recommendationFilter !== 'all') params.append('recommendation', recommendationFilter);

        dispatch(
          fetchJobCandidates({
            jobId: jobFilter,
            search: searchQuery,
            status: statusFilter,
            page,
            limit: 10,
          }),
        );
      } catch (err) {
        console.error('Error fetching candidates:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch candidates');
        apiError(err instanceof Error ? err.message : 'Failed to fetch candidates');
      }
    },
    [
      user?.id,
      searchQuery,
      statusFilter,
      jobFilter,
      dateRange,
      scoreRange,
      recommendationFilter,
      sortBy,
      sortOrder,
    ],
  );

  // Fetch available jobs for filter
  const fetchJobs = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/jobs?profileId=${user.id}&limit=100`);
      const data = await response.json();

      if (data.success) {
        setAvailableJobs(
          data.jobs.map((job: Record<string, unknown>) => ({
            id: job.id,
            title: job.title,
          })),
        );
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    fetchCandidates(1);
    fetchJobs();
  }, [fetchCandidates, fetchJobs]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (jobFilter) params.set('job', jobFilter);
    if (dateRange.start) params.set('startDate', dateRange.start);
    if (dateRange.end) params.set('endDate', dateRange.end);
    if (scoreRange.min) params.set('minScore', scoreRange.min);
    if (scoreRange.max) params.set('maxScore', scoreRange.max);
    if (recommendationFilter !== 'all') params.set('recommendation', recommendationFilter);
    if (sortBy !== 'created_at') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);

    const newUrl = `/dashboard/candidates${params.toString() ? '?' + params.toString() : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [
    searchQuery,
    statusFilter,
    jobFilter,
    dateRange,
    scoreRange,
    recommendationFilter,
    sortBy,
    sortOrder,
    router,
  ]);

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
    if (pagination?.hasMore && !isLoading) {
      fetchCandidates(pagination.page + 1);
    }
  }, [pagination, isLoading, fetchCandidates]);

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

  // Bulk operations functions
  const handleSelectCandidate = useCallback((candidateId: string, checked: boolean) => {
    setSelectedCandidates((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(candidateId);
      } else {
        newSet.delete(candidateId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedCandidates(new Set(candidates.map((c) => c.id)));
        setIsSelectAll(true);
      } else {
        setSelectedCandidates(new Set());
        setIsSelectAll(false);
      }
    },
    [candidates],
  );

  const performBulkAction = useCallback(
    async (action: string) => {
      if (selectedCandidates.size === 0) return;

      setIsPerformingBulkAction(true);
      try {
        const response = await fetch('/api/candidates/bulk-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateIds: Array.from(selectedCandidates),
            action,
            profileId: user?.id,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to perform bulk action');
        }

        success(`Successfully ${action} ${selectedCandidates.size} candidate(s)`);

        // Clear selection and refresh data
        setSelectedCandidates(new Set());
        setIsSelectAll(false);
        setShowBulkActions(false);
        fetchCandidates(1);
      } catch (err) {
        console.error('Error performing bulk action:', err);
        showError(err instanceof Error ? err.message : 'Failed to perform bulk action');
      } finally {
        setIsPerformingBulkAction(false);
      }
    },
    [selectedCandidates, user?.id, success, showError, fetchCandidates],
  );

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_yes':
        return 'text-green-700 bg-green-100';
      case 'yes':
        return 'text-green-600 bg-green-50';
      case 'maybe':
        return 'text-yellow-600 bg-yellow-50';
      case 'no':
        return 'text-red-600 bg-red-50';
      case 'strong_no':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'bg-gray-100 text-gray-700';
      case 'interview_scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'shortlisted':
        return 'bg-yellow-100 text-yellow-700';
      case 'reference_check':
        return 'bg-purple-100 text-purple-700';
      case 'offer_extended':
        return 'bg-orange-100 text-orange-700';
      case 'offer_accepted':
        return 'bg-green-100 text-green-700';
      case 'hired':
        return 'bg-green-200 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'withdrawn':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'Under Review';
      case 'interview_scheduled':
        return 'Interview Scheduled';
      case 'shortlisted':
        return 'Shortlisted';
      case 'reference_check':
        return 'Reference Check';
      case 'offer_extended':
        return 'Offer Extended';
      case 'offer_accepted':
        return 'Offer Accepted';
      case 'hired':
        return 'Hired';
      case 'rejected':
        return 'Rejected';
      case 'withdrawn':
        return 'Withdrawn';
      default:
        return 'Under Review';
    }
  };

  if (!user) return null;

  const hasFilters =
    searchQuery ||
    statusFilter !== 'all' ||
    jobFilter ||
    dateRange.start ||
    dateRange.end ||
    scoreRange.min ||
    scoreRange.max ||
    recommendationFilter !== 'all' ||
    sortBy !== 'created_at' ||
    sortOrder !== 'desc';

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
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard/jobs/new">
                  <Button className="flex items-center">
                    <BriefcaseIcon className="w-4 h-4 mr-2" />
                    Create New Job
                  </Button>
                </Link>
              </div>
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
                <ClockIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">In Progress</p>
                <p className="text-xl font-bold text-text">{stats.pending}</p>
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
              {hasFilters && <span className="ml-2 w-2 h-2 bg-primary rounded-full"></span>}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-light space-y-4">
              {/* Status Filter */}
              <div>
                <span className="text-sm font-medium text-muted-text block mb-2">Status:</span>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'completed', 'in_progress'] as CandidateStatusFilter[]).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusFilter(status)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          statusFilter === status
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-muted-text border-gray-light hover:border-primary'
                        }`}
                      >
                        {status === 'all'
                          ? 'All'
                          : status === 'in_progress'
                            ? 'In Progress'
                            : 'Completed'}
                      </button>
                    ),
                  )}
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
                  {availableJobs.map((job) => (
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

              {/* Recommendation Filter */}
              <div>
                <span className="text-sm font-medium text-muted-text block mb-2">
                  Recommendation:
                </span>
                <div className="flex flex-wrap gap-2">
                  {['all', 'strong_yes', 'yes', 'maybe', 'no', 'strong_no'].map((rec) => (
                    <button
                      key={rec}
                      onClick={() => setRecommendationFilter(rec)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        recommendationFilter === rec
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-muted-text border-gray-light hover:border-primary'
                      }`}
                    >
                      {rec === 'all'
                        ? 'All'
                        : rec === 'strong_yes'
                          ? 'Strong Yes'
                          : rec === 'yes'
                            ? 'Yes'
                            : rec === 'maybe'
                              ? 'Maybe'
                              : rec === 'no'
                                ? 'No'
                                : 'Strong No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-text block mb-2">
                    Start Date:
                  </span>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-text block mb-2">End Date:</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Score Range Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-text block mb-2">Min Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={scoreRange.min}
                    onChange={(e) => setScoreRange((prev) => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-text block mb-2">Max Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="100"
                    value={scoreRange.max}
                    onChange={(e) => setScoreRange((prev) => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sorting Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-text block mb-2">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="created_at">Date Applied</option>
                    <option value="score">Score</option>
                    <option value="full_name">Name</option>
                    <option value="completion_percentage">Completion</option>
                  </select>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-text block mb-2">Order:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setJobFilter('');
                    setDateRange({ start: '', end: '' });
                    setScoreRange({ min: '', max: '' });
                    setRecommendationFilter('all');
                    setSortBy('created_at');
                    setSortOrder('desc');
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
                : 'Create job postings and start interviewing candidates to see them here'}
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
          // Candidates Table
          <>
            <div className="bg-white rounded-lg border border-gray-light overflow-hidden">
              <div className="p-4 border-b border-gray-light">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="font-medium text-text">Candidates ({pagination?.total || 0})</h3>

                    {/* Bulk Selection */}
                    {candidates.length > 0 && (
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={isSelectAll}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-gray-light text-primary focus:ring-primary"
                          />
                          <span className="text-muted-text">Select All</span>
                        </label>

                        {selectedCandidates.size > 0 && (
                          <span className="text-sm text-primary font-medium">
                            {selectedCandidates.size} selected
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bulk Actions */}
                  {selectedCandidates.size > 0 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkActions(!showBulkActions)}
                        className="flex items-center"
                      >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Bulk Actions
                        <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                          {selectedCandidates.size}
                        </span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bulk Actions Menu */}
                {showBulkActions && selectedCandidates.size > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-light">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => performBulkAction('shortlist')}
                        disabled={isPerformingBulkAction}
                        className="flex items-center"
                      >
                        <TrophyIcon className="w-4 h-4 mr-2" />
                        Shortlist Selected
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => performBulkAction('reject')}
                        disabled={isPerformingBulkAction}
                        className="flex items-center"
                      >
                        <XCircleIcon className="w-4 h-4 mr-2" />
                        Reject Selected
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => performBulkAction('archive')}
                        disabled={isPerformingBulkAction}
                        className="flex items-center"
                      >
                        <DocumentIcon className="w-4 h-4 mr-2" />
                        Archive Selected
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCandidates(new Set());
                          setIsSelectAll(false);
                          setShowBulkActions(false);
                        }}
                        className="flex items-center"
                      >
                        <XMarkIcon className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={isSelectAll}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-light text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-light">
                    {candidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCandidates.has(candidate.id)}
                            onChange={(e) => handleSelectCandidate(candidate.id, e.target.checked)}
                            className="rounded border-gray-light text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {candidate.name}
                            </div>
                            {candidate.email && (
                              <div className="text-sm text-gray-500">{candidate.email}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/dashboard/jobs/${candidate.jobId}`}
                            className="text-sm text-primary hover:text-primary/80 flex items-center"
                          >
                            <BriefcaseIcon className="w-3 h-3 mr-1" />
                            {candidate.jobTitle}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(candidate.status)}`}
                          >
                            {getStatusLabel(candidate.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {candidate.evaluation && candidate.evaluation.score ? (
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-sm font-bold ${getScoreColor(candidate.evaluation.score)}`}
                              >
                                {candidate.evaluation.score}/100
                              </span>
                              <div
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(candidate.evaluation.recommendation)}`}
                              >
                                {getRecommendationLabel(candidate.evaluation.recommendation)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${candidate.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">{candidate.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(candidate.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link href={`/dashboard/candidates/${candidate.id}`}>
                              <Button variant="outline" size="sm" className="flex items-center">
                                <EyeIcon className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </Link>

                            {candidate.candidateStatus === 'under_review' && (
                              <Button
                                size="sm"
                                className="flex items-center"
                                onClick={() => {
                                  setSelectedCandidateForScheduling(candidate);
                                  setShowScheduler(true);
                                }}
                              >
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                Schedule
                              </Button>
                            )}

                            {candidate.evaluation?.recommendation === 'strong_yes' && (
                              <Button size="sm" className="flex items-center">
                                <TrophyIcon className="w-4 h-4 mr-1" />
                                Shortlist
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

        {/* Interview Scheduler Modal */}
        {showScheduler && selectedCandidateForScheduling && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <InterviewScheduler
                candidateId={selectedCandidateForScheduling.id}
                candidateName={selectedCandidateForScheduling.name}
                jobTitle={selectedCandidateForScheduling.jobTitle}
                onScheduled={() => {
                  setShowScheduler(false);
                  setSelectedCandidateForScheduling(null);
                  fetchCandidates(); // Refresh the list
                  success('Interview scheduled successfully!');
                }}
                onCancel={() => {
                  setShowScheduler(false);
                  setSelectedCandidateForScheduling(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
