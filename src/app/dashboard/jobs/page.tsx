'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/providers/ToastProvider';
import { RootState, useAppSelector, useAppDispatch } from '@/store';
import { JobData } from '@/lib/services/jobsService';
import { JobStatus } from '@/lib/supabase';
import { 
  PlusIcon,
  BriefcaseIcon,
  EyeIcon,
  ClipboardDocumentIcon,
  UserGroupIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  LinkIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { fetchJobsByProfile } from '@/store/jobs/jobsThunks';
import { 
  selectJobsList, 
  selectJobsLoading, 
  selectJobsError,
  selectJobsStats
} from '@/store/jobs/jobsSelectors';

interface JobsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function JobsPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  // State for jobs and pagination
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [pagination, setPagination] = useState<JobsPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch jobs function
  const fetchJobs = useCallback(async (page = 1, reset = false, search = '', status = '') => {
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

      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      if (reset || page === 1) {
        setJobs(data.jobs);
      } else {
        setJobs(prev => [...prev, ...data.jobs]);
      }
      
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      loadState(false);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    fetchJobs(1, true);
  }, [fetchJobs]);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    fetchJobs(1, true, query, statusFilter);
  }, [fetchJobs, statusFilter]);

  // Filter handler
  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    fetchJobs(1, true, searchQuery, status);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const copyInterviewLink = async (job: JobData) => {
    const link = job.interviewLink || `${window.location.origin}/interview/${job.interviewToken}`;
    
    try {
      await navigator.clipboard.writeText(link);
      success('Interview link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      showError('Failed to copy link to clipboard');
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'interviewing':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'closed':
        return 'bg-green-100 text-green-600 border-green-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusLabel = (status: JobStatus) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'interviewing':
        return 'Interviewing';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  if (!user) return null; // DashboardLayout handles loading/auth

  const hasJobs = jobs.length > 0 || (!isLoading && pagination && pagination.total > 0);

  return (
    <DashboardLayout title="Jobs">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Your Jobs</h1>
              <p className="text-muted-text">
                Manage your job postings and track candidate applications
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link href="/dashboard/jobs/new">
                <Button className="flex items-center">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create New Job
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg border border-gray-light p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Total Jobs</p>
                <p className="text-xl font-bold text-text">{pagination?.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-light p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-blue/10 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-accent-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Total Candidates</p>
                <p className="text-xl font-bold text-text">
                  {jobs.reduce((total, job) => total + (job.candidateCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-light p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-teal/10 rounded-lg flex items-center justify-center">
                <CheckBadgeIcon className="w-5 h-5 text-accent-teal" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Usage</p>
                <p className="text-xl font-bold text-text">
                  {user.usageCounts.activeJobs}/{user.subscription?.maxJobs === 999 ? '∞' : user.subscription?.maxJobs}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters - Only show when user has jobs */}
        {hasJobs && (
          <div className="bg-white rounded-lg border border-gray-light p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-muted-text absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search jobs by title..."
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
                {statusFilter && (
                  <span className="ml-2 w-2 h-2 bg-primary rounded-full"></span>
                )}
              </Button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-light">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-muted-text">Status:</span>
                  <button
                    onClick={() => handleStatusFilter('')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      statusFilter === '' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-muted-text border-gray-light hover:border-primary'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleStatusFilter('draft')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      statusFilter === 'draft' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-muted-text border-gray-light hover:border-primary'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => handleStatusFilter('interviewing')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      statusFilter === 'interviewing' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-muted-text border-gray-light hover:border-primary'
                    }`}
                  >
                    Interviewing
                  </button>
                  <button
                    onClick={() => handleStatusFilter('closed')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      statusFilter === 'closed' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-muted-text border-gray-light hover:border-primary'
                    }`}
                  >
                    Closed
                  </button>
                  
                  {statusFilter && (
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setShowFilters(false);
                        handleStatusFilter('');
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
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
            <p className="text-accent-red text-sm">{error}</p>
          </div>
        )}

        {/* Jobs List */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-light p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3 text-muted-text">Loading jobs...</span>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg border border-gray-light p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">
              {searchQuery || statusFilter ? 'No jobs found' : 'No jobs yet'}
            </h3>
            <p className="text-muted-text mb-6">
              {searchQuery || statusFilter 
                ? 'Try adjusting your search criteria or filters' 
                : 'Create your first job posting to start interviewing candidates with AI'
              }
            </p>
            {!searchQuery && !statusFilter && (
              <Link href="/dashboard/jobs/new">
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Your First Job
                </Button>
              </Link>
            )}
          </div>
        ) : (
          // Jobs Grid
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg border border-gray-light p-6 hover:border-primary transition-colors">
                  {/* Job Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text mb-2">{job.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-text">
                        <div className="flex items-center space-x-1">
                          <ClipboardDocumentIcon className="w-4 h-4" />
                          <span>Created {formatDate(job.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <UserGroupIcon className="w-4 h-4" />
                          <span>{job.candidateCount || 0} candidates</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        job.isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-gray-light text-muted-text'
                      }`}>
                        {job.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="mb-4">
                    {job.fields?.experienceLevel && (
                      <div className="mb-2">
                        <span className="text-sm text-muted-text">Experience: </span>
                        <span className="text-sm text-text capitalize">
                          {job.fields.experienceLevel.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    )}
                    
                    {job.fields?.skills && job.fields.skills.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm text-muted-text mb-1 block">Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {job.fields.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                              {skill}
                            </span>
                          ))}
                          {job.fields.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-light text-muted-text text-xs rounded">
                              +{job.fields.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mb-2">
                      <span className="text-sm text-muted-text">Format: </span>
                      <span className="text-sm text-text capitalize">
                        {job.interviewFormat === 'text' ? 'Text-based' : 'Video'} Interview
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/jobs/${job.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    
                    <Link href={`/dashboard/jobs/${job.id}/edit`}>
                      <Button variant="outline" size="sm" className="flex items-center">
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/providers/ToastProvider';
import { RootState, useAppSelector, useAppDispatch } from '@/store';
import { JobData } from '@/lib/services/jobsService';
import { JobStatus } from '@/lib/supabase';
import { 
  PlusIcon,
  BriefcaseIcon,
  EyeIcon,
  PencilIcon,
  LinkIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { fetchJobsByProfile } from '@/store/jobs/jobsThunks';
import { 
  selectJobsList, 
  selectJobsLoading, 
  selectJobsError,
  selectJobsStats
} from '@/store/jobs/jobsSelectors';

interface JobsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function JobsPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  // State for jobs and pagination
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [pagination, setPagination] = useState<JobsPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch jobs function
  const fetchJobs = useCallback(async (page = 1, reset = false, search = '', status = '') => {
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

      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      if (reset || page === 1) {
        setJobs(data.jobs);
      } else {
        setJobs(prev => [...prev, ...data.jobs]);
      }
      
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      loadState(false);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    fetchJobs(1, true);
  }, [fetchJobs]);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    fetchJobs(1, true, query, statusFilter);
  }, [fetchJobs, statusFilter]);

  // Filter handler
  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    fetchJobs(1, true, searchQuery, status);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const copyInterviewLink = async (job: JobData) => {
    const link = job.interviewLink || `${window.location.origin}/interview/${job.interviewToken}`;
    
    try {
      await navigator.clipboard.writeText(link);
      success('Interview link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      showError('Failed to copy link to clipboard');
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'interviewing':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'closed':
        return 'bg-green-100 text-green-600 border-green-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusLabel = (status: JobStatus) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'interviewing':
        return 'Interviewing';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  if (!user) return null; // DashboardLayout handles loading/auth

  const hasJobs = jobs.length > 0 || (!isLoading && pagination && pagination.total > 0);

  return (
    <DashboardLayout title="Jobs">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Your Jobs</h1>
              <p className="text-muted-text">
                Manage your job postings and track candidate applications
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link href="/dashboard/jobs/new">
                <Button className="flex items-center">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create New Job
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg border border-gray-light p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Total Jobs</p>
                <p className="text-xl font-bold text-text">{pagination?.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-light p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-blue/10 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-accent-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Total Candidates</p>
                <p className="text-xl font-bold text-text">
                  {jobs.reduce((total, job) => total + (job.candidateCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-light p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-teal/10 rounded-lg flex items-center justify-center">
                <CheckBadgeIcon className="w-5 h-5 text-accent-teal" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-text">Usage</p>
                <p className="text-xl font-bold text-text">
                  {user.usageCounts.activeJobs}/{user.subscription?.maxJobs === 999 ? '∞' : user.subscription?.maxJobs}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters - Only show when user has jobs */}
        {hasJobs && (
          <div className="bg-white rounded-lg border border-gray-light p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-muted-text absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search jobs by title..."
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
                {statusFilter && (
                  <span className="ml-2 w-2 h-2 bg-primary rounded-full"></span>
                )}
              </Button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-light">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-muted-text">Status:</span>
                  <button
                    onClick={() => handleStatusFilter('')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      statusFilter === '' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-muted-text border-gray-light hover:border-primary'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleStatusFilter('draft')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      statusFilter === 'draft' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-muted-text border-gray-light hover:border-primary'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => handleStatusFilter('interviewing')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      statusFilter === 'interviewing' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-muted-text border-gray-light hover:border-primary'
                    }`}
                  >
                    Interviewing
                  </button>
                  <button
                    onClick={() => handleStatusFilter('closed')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      statusFilter === 'closed' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-muted-text border-gray-light hover:border-primary'
                    }`}
                  >
                    Closed
                  </button>
                  
                  {statusFilter && (
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setShowFilters(false);
                        handleStatusFilter('');
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
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
            <p className="text-accent-red text-sm">{error}</p>
          </div>
        )}

        {/* Jobs List */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-light p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3 text-muted-text">Loading jobs...</span>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg border border-gray-light p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">
              {searchQuery || statusFilter ? 'No jobs found' : 'No jobs yet'}
            </h3>
            <p className="text-muted-text mb-6">
              {searchQuery || statusFilter 
                ? 'Try adjusting your search criteria or filters' 
                : 'Create your first job posting to start interviewing candidates with AI'
              }
            </p>
            {!searchQuery && !statusFilter && (
              <Link href="/dashboard/jobs/new">
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Your First Job
                </Button>
              </Link>
            )}
          </div>
        ) : (
          // Jobs Grid
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg border border-gray-light p-6 hover:border-primary transition-colors">
                  {/* Job Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text mb-2">{job.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-text">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Created {formatDate(job.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <UserGroupIcon className="w-4 h-4" />
                          <span>{job.candidateCount || 0} candidates</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        job.isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-gray-light text-muted-text'
                      }`}>
                        {job.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="mb-4">
                    {job.fields?.experienceLevel && (
                      <div className="mb-2">
                        <span className="text-sm text-muted-text">Experience: </span>
                        <span className="text-sm text-text capitalize">
                          {job.fields.experienceLevel.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    )}
                    
                    {job.fields?.skills && job.fields.skills.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm text-muted-text mb-1 block">Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {job.fields.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                              {skill}
                            </span>
                          ))}
                          {job.fields.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-light text-muted-text text-xs rounded">
                              +{job.fields.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mb-2">
                      <span className="text-sm text-muted-text">Format: </span>
                      <span className="text-sm text-text capitalize">
                        {job.interviewFormat === 'text' ? 'Text-based' : 'Video'} Interview
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/jobs/${job.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    
                    <Link href={`/dashboard/jobs/${job.id}/edit`}>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center"
                      onClick={() => copyInterviewLink(job)}
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Copy Link
                    </Button>
                    
                    {job.candidateCount && job.candidateCount > 0 && (
                      <Link href={`/dashboard/candidates?job=${job.id}`}>
                        <Button size="sm" className="flex items-center">
                          <UserGroupIcon className="w-4 h-4 mr-1" />
                          View Candidates
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="mt-8 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-3 text-muted-text">Loading more jobs...</span>
              </div>
            )}

            {/* Load more button (backup for infinite scroll) */}
            {pagination?.hasMore && !isLoadingMore && (
              <div className="mt-8 text-center">
                <Button variant="outline" onClick={loadMore}>
                  Load More Jobs
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 