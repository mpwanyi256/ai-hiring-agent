'use client';

import { useState, useEffect, use } from 'react';
import JobDetailsLayout from '@/components/jobs/JobDetailsLayout';
import JobOverview from '@/components/jobs/JobOverview';
import QuestionManager from '@/components/questions/QuestionManager';
import JobCandidates from '@/components/jobs/JobCandidates';
import JobShortlisted from '@/components/jobs/JobShortlisted';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchJobById, fetchJobQuestions } from '@/store/jobs/jobsThunks';
import { resetCurrentJob } from '@/store/jobs/jobsSlice';
import { selectCurrentJob, selectJobsLoading, selectJobsError } from '@/store/jobs/jobsSelectors';
import { shareJob } from '@/lib/utils';
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
    dispatch(fetchJobById(resolvedParams.id))
      .unwrap()
      .catch((err) => {
        showError(err instanceof Error ? err.message : 'Failed to fetch job details');
      });

    return () => {
      // Clean up function to reset the current job when the component unmounts
      dispatch(resetCurrentJob());
    };
  }, [resolvedParams.id, dispatch, showError]);

  // Fetch questions when switching to Questions tab
  useEffect(() => {
    if (activeTab === 'questions' && job?.id) {
      dispatch(fetchJobQuestions(job.id))
        .unwrap()
        .catch((err) => {
          showError(err instanceof Error ? err.message : 'Failed to fetch questions');
        });
    }
  }, [activeTab, job?.id, dispatch, showError]);

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
        message={
          error ||
          'The job you are looking for does not exist or you do not have permission to view it.'
        }
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
      case 'shortlisted':
        return <JobShortlisted jobId={job.id} />;
      default:
        return <JobOverview job={job} />;
    }
  };

  return (
    <JobDetailsLayout
      job={job}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onShareJob={() => shareJob(job)}
    >
      {renderTabContent()}
    </JobDetailsLayout>
  );
}
