'use client';

import { useState, useEffect, use } from 'react';
import JobDetailsLayout from '@/components/jobs/JobDetailsLayout';
import JobOverview from '@/components/jobs/JobOverview';
import QuestionManager from '@/components/questions/QuestionManager';
import JobCandidates from '@/components/jobs/JobCandidates';
import JobEvaluations from '@/components/jobs/JobEvaluations';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchJobById } from '@/store/jobs/jobsThunks';
import { resetCurrentJob } from '@/store/jobs/jobsSlice';
import { selectCurrentJob, selectJobsLoading, selectJobsError } from '@/store/jobs/jobsSelectors';
import { copyInterviewLink } from '@/lib/utils';
import { Loading } from '@/components/ui/Loading';
import { DashboardError } from '../ui/DashboardError';
import { useToast } from '../providers/ToastProvider';

interface CurrentJobWrapperPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CurrentJobWrapper({ params }: CurrentJobWrapperPageProps) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const { error: showError } = useToast();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectJobsLoading);
  const error = useAppSelector(selectJobsError);
  const [activeTab, setActiveTab] = useState('overview');
  const job = useAppSelector(selectCurrentJob);

  // Fetch job details and questions
  useEffect(() => {
    dispatch(fetchJobById(resolvedParams.id)).unwrap().catch((err) => {
      showError(err instanceof Error ? err.message : 'Failed to fetch job details');
    });

    return () => { // Clean up function to reset the current job when the component unmounts
      dispatch(resetCurrentJob());
    }
  }, [resolvedParams.id, dispatch, showError]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading job details..." />
      </div>
    );
  }

  if (error || !job) {
    return (
      <DashboardError 
        title="Job Not Found" 
        message={error || 'The job you are looking for does not exist or you do not have permission to view it.'} 
      />
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <JobOverview job={job} />;
      case 'questions':
        return <QuestionManager />;
      case 'candidates':
        return <JobCandidates job={job} />;
      case 'evaluations':
        return <JobEvaluations job={job} />;
      default:
        return <JobOverview job={job} />;
    }
  };

  return (
    <JobDetailsLayout
      job={job}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onShareJob={shareJob}
    >
      {renderTabContent()}
    </JobDetailsLayout>
  );
}
