'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TabNavigation from '@/components/ui/TabNavigation';
import JobOverview from '@/components/jobs/JobOverview';
import QuestionManager from '@/components/questions/QuestionManager';
import JobCandidates from '@/components/jobs/JobCandidates';
import JobEvaluations from '@/components/jobs/JobEvaluations';
import { RootState, useAppSelector, useAppDispatch } from '@/store';
import { fetchJobById, updateJobStatus } from '@/store/jobs/jobsThunks';
import { selectCurrentJob, selectJobsLoading, selectJobsError } from '@/store/jobs/jobsSelectors';
import { JobStatus } from '@/lib/supabase';
import { JobQuestion } from '@/types/interview';
import { 
  ArrowLeftIcon,
  BriefcaseIcon,
  PencilIcon,
  LinkIcon,
  UserGroupIcon,
  EyeIcon,
  ShareIcon,
  XCircleIcon,
  PlayIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface JobDetailsPageProps {
  params: {
    id: string;
  };
}

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const job = useAppSelector(selectCurrentJob);
  const isLoading = useAppSelector(selectJobsLoading);
  const error = useAppSelector(selectJobsError);
  const [questions, setQuestions] = useState<JobQuestion[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch job details and questions
  useEffect(() => {
    const fetchJobData = async () => {
      if (!user?.id || !params.id) return;

      try {
        // Fetch job using Redux thunk
        const result = await dispatch(fetchJobById(params.id));
        
        if (fetchJobById.rejected.match(result)) {
          console.error('Failed to fetch job:', result.error.message);
          return;
        }

        const jobData = result.payload;
        
        // Verify the job belongs to the current user
        if (jobData.profileId !== user.id) {
          throw new Error('Job not found');
        }

        // Fetch questions
        try {
          const questionsResponse = await fetch(`/api/jobs/${params.id}/questions`);
          const questionsData = await questionsResponse.json();
          
          if (questionsData.success) {
            setQuestions(questionsData.questions || []);
          }
        } catch (questionError) {
          console.error('Error fetching questions:', questionError);
        }
      } catch (err) {
        console.error('Error fetching job:', err);
      }
    };

    fetchJobData();
  }, [user?.id, params.id, dispatch]);

  const updateJobStatusHandler = async (newStatus: JobStatus) => {
    if (!job) return;

    setIsUpdatingStatus(true);
    try {
      const result = await dispatch(updateJobStatus({ 
        jobId: job.id, 
        status: newStatus 
      }));
      
      if (updateJobStatus.rejected.match(result)) {
        throw new Error(result.error.message || 'Failed to update job status');
      }
    } catch (err) {
      console.error('Error updating job status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update job status');
    } finally {
      setIsUpdatingStatus(false);
    }
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

  const handleQuestionsChange = (updatedQuestions: JobQuestion[]) => {
    setQuestions(updatedQuestions);
    // Questions list has been updated, component will re-render with new count
  };

  // Define tabs
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BriefcaseIcon />
    },
    {
      id: 'questions',
      label: 'Questions',
      icon: <ClipboardDocumentListIcon />,
      count: questions.length
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: <UserGroupIcon />,
      count: job?.candidateCount || 0
    },
    {
      id: 'evaluations',
      label: 'Evaluations',
      icon: <ChartBarIcon />,
      count: 0 // TODO: Add evaluation count
    }
  ];

  if (!user) return null;

  if (isLoading) {
    return (
      <DashboardLayout title="Job Details">
        <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto">
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
      <div className="max-w-6xl mx-auto">
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

        {/* Job Header Card */}
        <div className="bg-white rounded-lg border border-gray-light mb-6">
          <div className="p-6 border-b border-gray-light">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-text mb-2">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-text">
                  <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                  <span>{(job.candidateCount || 0)} candidates</span>
                  <span className="capitalize">{job.interviewFormat} Interview</span>
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
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyInterviewLink} className="flex items-center">
                <LinkIcon className="w-4 h-4 mr-1" />
                Copy Interview Link
              </Button>
              
              {/* Job Status Management */}
              {job.status === 'draft' ? (
                <Button 
                  size="sm" 
                  onClick={() => updateJobStatusHandler('interviewing')}
                  disabled={isUpdatingStatus}
                  className="flex items-center"
                >
                  <PlayIcon className="w-4 h-4 mr-1" />
                  {isUpdatingStatus ? 'Starting...' : 'Start Interviewing'}
                </Button>
              ) : job.status === 'interviewing' ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => updateJobStatusHandler('closed')}
                  disabled={isUpdatingStatus}
                  className="flex items-center"
                >
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  {isUpdatingStatus ? 'Closing...' : 'Close Position'}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => updateJobStatusHandler('interviewing')}
                  disabled={isUpdatingStatus}
                  className="flex items-center"
                >
                  <PlayIcon className="w-4 h-4 mr-1" />
                  {isUpdatingStatus ? 'Reopening...' : 'Reopen Position'}
                </Button>
              )}

              {questions.length === 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActiveTab('questions')}
                  className="flex items-center"
                >
                  <SparklesIcon className="w-4 h-4 mr-1" />
                  Generate Questions
                </Button>
              )}
              
              {job.status === 'interviewing' && (
                <Link href={job.interviewLink || `/interview/${job.interviewToken}`} target="_blank">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Test Interview
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <TabNavigation 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'overview' && (
            <JobOverview job={job} />
          )}
          
          {activeTab === 'questions' && (
            <QuestionManager 
              jobId={job.id} 
              jobTitle={job.title}
              onQuestionsChange={handleQuestionsChange}
            />
          )}
          
          {activeTab === 'candidates' && (
            <JobCandidates job={job} />
          )}
          
          {activeTab === 'evaluations' && (
            <JobEvaluations job={job} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 