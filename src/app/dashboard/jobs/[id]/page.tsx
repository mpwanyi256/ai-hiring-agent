'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { RootState, useAppSelector } from '@/store';
import { JobData } from '@/lib/services/jobsService';
import { JobStatus } from '@/lib/supabase';
import { 
  ArrowLeftIcon,
  BriefcaseIcon,
  PencilIcon,
  LinkIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  EyeIcon,
  ShareIcon,
  CheckBadgeIcon,
  XCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface JobDetailsPageProps {
  params: {
    id: string;
  };
}

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  const router = useRouter();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [job, setJob] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      if (!user?.id || !params.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch job');
        }

        // Verify the job belongs to the current user
        if (data.job.profileId !== user.id) {
          throw new Error('Job not found');
        }

        setJob(data.job);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch job');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [user?.id, params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyInterviewLink = async () => {
    if (!job) return;
    const link = job.interviewLink || `${window.location.origin}/interview/${job.interviewToken}`;
    try {
      await navigator.clipboard.writeText(link);
      alert('Interview link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const shareJob = async () => {
    if (!job) return;
    const link = job.interviewLink || `${window.location.origin}/interview/${job.interviewToken}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AI Interview: ${job.title}`,
          text: `Take an AI-powered interview for the ${job.title} position`,
          url: link,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        copyInterviewLink();
      }
    } else {
      copyInterviewLink();
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

  if (!user) return null;

  if (isLoading) {
    return (
      <DashboardLayout title="Job Details">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-light p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3 text-muted-text">Loading job details...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout title="Job Details">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/jobs')}
              className="flex items-center"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
          <div className="bg-white rounded-lg border border-gray-light p-8 text-center">
            <XCircleIcon className="w-12 h-12 text-accent-red mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Job Not Found</h3>
            <p className="text-muted-text mb-6">
              {error || 'The job you are looking for does not exist or you do not have permission to view it.'}
            </p>
            <Button onClick={() => router.push('/dashboard/jobs')}>
              Return to Jobs
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={job.title}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/jobs')}
              className="flex items-center mb-4 sm:mb-0"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
            
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/jobs/${job.id}/edit`}>
                <Button variant="outline" size="sm" className="flex items-center">
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit Job
                </Button>
              </Link>
              
              <Button variant="outline" size="sm" onClick={shareJob} className="flex items-center">
                <ShareIcon className="w-4 h-4 mr-1" />
                Share
              </Button>
              
              <Link href={job.interviewLink || `/interview/${job.interviewToken}`} target="_blank">
                <Button size="sm" className="flex items-center">
                  <EyeIcon className="w-4 h-4 mr-1" />
                  Preview Interview
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Job Overview Card */}
        <div className="bg-white rounded-lg border border-gray-light p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text mb-2">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-text">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Created {formatDate(job.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>{job.candidateCount || 0} candidates</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>
                    {job.interviewFormat === 'text' ? 'Text-based' : 'Video'} Interview
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(job.status)}`}>
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

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-light">
            <Button variant="outline" size="sm" onClick={copyInterviewLink} className="flex items-center">
              <LinkIcon className="w-4 h-4 mr-1" />
              Copy Interview Link
            </Button>
            
            {job.candidateCount && job.candidateCount > 0 && (
              <Link href={`/dashboard/candidates?job=${job.id}`}>
                <Button variant="outline" size="sm" className="flex items-center">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  View {job.candidateCount} Candidate{job.candidateCount !== 1 ? 's' : ''}
                </Button>
              </Link>
            )}
            
            <Link href={job.interviewLink || `/interview/${job.interviewToken}`} target="_blank">
              <Button variant="outline" size="sm" className="flex items-center">
                <PlayIcon className="w-4 h-4 mr-1" />
                Test Interview
              </Button>
            </Link>
          </div>
        </div>

        {/* Job Requirements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Skills & Experience */}
          <div className="bg-white rounded-lg border border-gray-light p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Requirements</h2>
            
            {job.fields?.experienceLevel && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-text mb-2">Experience Level</h3>
                <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {job.fields.experienceLevel.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            )}
            
            {job.fields?.skills && job.fields.skills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-text mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.fields.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {job.fields?.traits && job.fields.traits.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-text mb-2">Desired Traits</h3>
                <div className="flex flex-wrap gap-2">
                  {job.fields.traits.map((trait, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-accent-blue/10 text-accent-blue rounded-full text-sm font-medium"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {!job.fields?.skills && !job.fields?.traits && !job.fields?.experienceLevel && (
              <p className="text-muted-text text-sm">No specific requirements specified.</p>
            )}
          </div>

          {/* Custom Fields */}
          <div className="bg-white rounded-lg border border-gray-light p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Additional Information</h2>
            
            {job.fields?.customFields && Object.keys(job.fields.customFields).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(job.fields.customFields).map(([key, field]) => (
                  <div key={key}>
                    <h3 className="text-sm font-medium text-text mb-1">{key}</h3>
                    <p className="text-sm text-muted-text">
                      {field.value} <span className="text-xs">({field.inputType})</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-text text-sm">No additional information specified.</p>
            )}
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-lg border border-gray-light p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">Job Description</h2>
          
          {job.fields?.jobDescription ? (
            <div 
              className="prose prose-sm max-w-none text-text"
              dangerouslySetInnerHTML={{ __html: job.fields.jobDescription }}
            />
          ) : (
            <p className="text-muted-text">No job description provided.</p>
          )}
        </div>

        {/* Interview Preview */}
        <div className="bg-white rounded-lg border border-gray-light p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Interview Process</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-text">AI-Powered Interview</h3>
                <p className="text-sm text-muted-text">
                  Candidates will participate in an automated {job.interviewFormat === 'text' ? 'text-based' : 'video'} interview
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-text">Format:</span>
                <span className="ml-2 text-text">
                  {job.interviewFormat === 'text' ? 'Text-based Q&A' : 'Async Video Responses'}
                </span>
              </div>
              <div>
                <span className="font-medium text-muted-text">Duration:</span>
                <span className="ml-2 text-text">15-30 minutes</span>
              </div>
              <div>
                <span className="font-medium text-muted-text">Questions:</span>
                <span className="ml-2 text-text">AI-generated based on job requirements</span>
              </div>
              <div>
                <span className="font-medium text-muted-text">Evaluation:</span>
                <span className="ml-2 text-text">Automated scoring and summary</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={job.interviewLink || `/interview/${job.interviewToken}`} target="_blank">
              <Button className="flex items-center sm:w-auto w-full">
                <PlayIcon className="w-4 h-4 mr-2" />
                Preview Interview Experience
              </Button>
            </Link>
            
            <Button variant="outline" onClick={copyInterviewLink} className="flex items-center sm:w-auto w-full">
              <LinkIcon className="w-4 h-4 mr-2" />
              Share Interview Link
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 