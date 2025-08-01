'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import JobsTable from '@/components/jobs/JobsTable';
import SearchAndFilters from '@/components/jobs/SearchAndFilters';
import { useToast } from '@/components/providers/ToastProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  PlusIcon,
  BriefcaseIcon,
  UserGroupIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { fetchJobsPaginated } from '@/store/jobs/jobsThunks';
import { CompanyJobs } from '@/types/jobs';
import { selectCompanyJobs } from '@/store/jobs/jobsSelectors';
import { apiError } from '@/lib/notification';
import { selectCompanySlug, selectHasActiveSubscription } from '@/store/auth/authSelectors';

export default function JobsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const companySlug = useAppSelector(selectCompanySlug);
  const { success, error: showError } = useToast();
  const dispatch = useAppDispatch();
  const { pagination, jobs } = useAppSelector(selectCompanyJobs);
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);

  // State for jobs and pagination
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch jobs function
  const fetchJobs = useCallback(
    async (page = 1, reset = false, search = '', status = '') => {
      if (!user?.id) return;

      const loadState = page === 1 ? setIsLoading : setIsLoadingMore;
      loadState(true);
      setError(null);

      try {
        await dispatch(
          fetchJobsPaginated({
            page: reset ? 1 : page,
            limit: 10,
            search,
            status,
          }),
        );
      } catch (err) {
        apiError('Failed to fetch jobs');
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      } finally {
        loadState(false);
      }
    },
    [dispatch, user?.id],
  );

  // Initial load
  useEffect(() => {
    fetchJobs(1, true);
  }, [fetchJobs]);

  // Search handler
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      fetchJobs(1, true, query, statusFilter);
    },
    [fetchJobs, statusFilter],
  );

  // Filter handler
  const handleStatusFilter = useCallback(
    (status: string) => {
      setStatusFilter(status);
      fetchJobs(1, true, searchQuery, status);
    },
    [fetchJobs, searchQuery],
  );

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setStatusFilter('');
    setShowFilters(false);
    fetchJobs(1, true, searchQuery, '');
  }, [fetchJobs, searchQuery]);

  // Load more for infinite scroll
  const loadMore = useCallback(() => {
    if (pagination?.hasMore && !isLoadingMore) {
      fetchJobs(pagination.page + 1, false, searchQuery, statusFilter);
    }
  }, [pagination, isLoadingMore, fetchJobs, searchQuery, statusFilter]);

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

  const copyInterviewLink = async (job: CompanyJobs) => {
    const link = `${window.location.origin}/jobs/${companySlug}/${job.interview_token}`;

    try {
      await navigator.clipboard.writeText(link);
      success('Interview link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      showError('Failed to copy link to clipboard');
    }
  };

  if (!user) return null;

  const hasJobs = pagination.hasMore || (!isLoading && pagination && pagination.total > 0);
  const totalCandidates = jobs.reduce((total, job) => total + (job.candidate_count || 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Job Positions</h1>
              <p className="text-sm text-gray-600">
                Manage your job postings and track candidate applications
              </p>
            </div>
            <div className="mt-3 sm:mt-0">
              <Link href="/dashboard/jobs/new">
                <Button
                  size="sm"
                  className={`flex items-center text-sm ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!hasActiveSubscription}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create New Job
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <MetricCard
            title="Total Jobs"
            value={pagination?.total || 0}
            subtitle="All job postings"
            icon={BriefcaseIcon}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
          />

          <MetricCard
            title="Candidates"
            value={totalCandidates}
            subtitle="Total applications"
            icon={UserGroupIcon}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
          />

          <MetricCard
            title="Active Jobs"
            value={user.usageCounts.activeJobs}
            subtitle={
              hasActiveSubscription ? `of ${user.subscription?.maxJobs} allowed` : 'No active plan'
            }
            icon={CheckBadgeIcon}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-50"
            progress={{
              current: user.usageCounts.activeJobs,
              max: hasActiveSubscription ? user.subscription?.maxJobs || 1 : 0,
              label: 'Usage',
            }}
          />
        </div>

        {/* Search and Filters - Only show when user has jobs */}
        <div className="mb-6">
          <SearchAndFilters
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            showFilters={showFilters}
            onSearchChange={handleSearch}
            onStatusFilterChange={handleStatusFilter}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Jobs Table */}
        {!hasJobs && !isLoading ? (
          // Empty State
          <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || statusFilter ? 'No jobs found' : 'No jobs yet'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {searchQuery || statusFilter
                ? 'Try adjusting your search criteria or filters'
                : 'Create your first job posting to start interviewing candidates with AI'}
            </p>
            {!searchQuery && !statusFilter && (
              <Link href="/dashboard/jobs/new">
                <Button
                  disabled={!hasActiveSubscription}
                  className={hasActiveSubscription ? '' : 'opacity-50 cursor-not-allowed'}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Your First Job
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <JobsTable onCopyLink={copyInterviewLink} isLoading={isLoading} />

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="mt-6 flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-3 text-sm text-gray-500">Loading more jobs...</span>
              </div>
            )}

            {/* Load more button (backup for infinite scroll) */}
            {pagination?.hasMore && !isLoadingMore && (
              <div className="mt-6 text-center">
                <Button variant="outline" size="sm" onClick={loadMore} className="text-sm">
                  Load More Jobs
                </Button>
              </div>
            )}

            {/* Results summary */}
            {pagination && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Showing {jobs.length} of {pagination.total} jobs
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
