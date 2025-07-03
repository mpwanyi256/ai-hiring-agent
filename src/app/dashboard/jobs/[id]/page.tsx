'use client';

import { useState, useEffect, use } from 'react';
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
import { fetchJobById } from '@/store/jobs/jobsThunks';
import { selectCurrentJob, selectJobsLoading, selectJobsError, selectJobQuestionsCount } from '@/store/jobs/jobsSelectors';
import { 
  ArrowLeftIcon,
  BriefcaseIcon,
  PencilIcon,
  UserGroupIcon,
  EyeIcon,
  ShareIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { copyInterviewLink } from '@/lib/utils';
import { CurrentJobHeader } from '@/components/currentJob/CurrentJobHeader';
import { Loading } from '@/components/ui/Loading';

interface JobDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);

  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isLoading = useAppSelector(selectJobsLoading);
  const error = useAppSelector(selectJobsError);
  const [activeTab, setActiveTab] = useState('overview');

  const job = useAppSelector(selectCurrentJob);
  const questionsCount = useAppSelector(selectJobQuestionsCount);

  // Fetch job details and questions
  useEffect(() => {
    const fetchJobData = async () => {
      if (!user?.id || !resolvedParams.id) return;

      try {
        dispatch(fetchJobById(resolvedParams.id));
      } catch (err) {
        console.error('Error fetching job:', err);
      }
    };

    fetchJobData();
  }, [user?.id, resolvedParams.id, dispatch]);


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
        copyInterviewLink(link);
      }
    } else {
      copyInterviewLink(link);
    }
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
      count: questionsCount
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
  
  if (isLoading) {
    return (
      <DashboardLayout title="Job Details">
        <Loading message="Loading job details..." />
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
          <CurrentJobHeader onSetActiveTab={setActiveTab} />

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
