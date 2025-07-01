'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { fetchJobsByProfile } from '@/store/slices/jobsSlice';
import { RootState, AppDispatch } from '@/store';
import { User } from '@/store/slices/authSlice';
import { 
  PlusIcon,
  BriefcaseIcon,
  EyeIcon,
  PencilIcon,
  LinkIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

export default function JobsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };
  const { jobs, isLoading, error } = useSelector((state: RootState) => state.jobs);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchJobsByProfile(user.id));
    }
  }, [dispatch, user?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const copyInterviewLink = async (job: { interviewLink?: string; interviewToken: string }) => {
    const link = job.interviewLink || `${window.location.origin}/interview/${job.interviewToken}`;
    try {
      await navigator.clipboard.writeText(link);
      // You could add a toast notification here
      alert('Interview link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  if (!user) return null; // DashboardLayout handles loading/auth

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
                <p className="text-sm font-medium text-muted-text">Active Jobs</p>
                <p className="text-xl font-bold text-text">{jobs.length}</p>
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
            <h3 className="text-lg font-semibold text-text mb-2">No jobs yet</h3>
            <p className="text-muted-text mb-6">
              Create your first job posting to start interviewing candidates with AI
            </p>
            <Link href="/dashboard/jobs/new">
              <Button>
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Your First Job
              </Button>
            </Link>
          </div>
        ) : (
          // Jobs Grid
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
                  <div className="flex items-center space-x-1">
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
        )}
      </div>
    </DashboardLayout>
  );
} 