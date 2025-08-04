'use client';

import { useState, useEffect, use } from 'react';
import JobDetailsLayout from '@/components/jobs/JobDetailsLayout';
import JobOverview from '@/components/jobs/JobOverview';
import QuestionManager from '@/components/questions/QuestionManager';
import JobCandidates from '@/components/jobs/JobCandidates';
import JobShortlisted from '@/components/jobs/JobShortlisted';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchJobById } from '@/store/jobs/jobsThunks';
import { resetCurrentJob } from '@/store/jobs/jobsSlice';
import { selectCurrentJob, selectJobsError } from '@/store/jobs/jobsSelectors';
import { shareJob } from '@/lib/utils';
import { Loading } from '@/components/ui/Loading';
import { DashboardError } from '../ui/DashboardError';
import { useToast } from '../providers/ToastProvider';
import { setSelectedCandidate } from '@/store/selectedCandidate/selectedCandidateSlice';
import { selectCompany } from '@/store/company/companySelectors';

interface CurrentJobWrapperPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CurrentJobWrapper({ params }: CurrentJobWrapperPageProps) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useToast();
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectJobsError);
  const [activeTab, setActiveTab] = useState('overview');
  const job = useAppSelector(selectCurrentJob);
  const company = useAppSelector(selectCompany);

  // Fetch job details and questions
  useEffect(() => {
    setLoading(true);
    dispatch(fetchJobById(resolvedParams.id))
      .unwrap()
      .catch((err) => {
        showError(err instanceof Error ? err.message : 'Failed to fetch job details');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      // Clean up function to reset the current job when the component unmounts
      dispatch(resetCurrentJob());
      dispatch(setSelectedCandidate(null));
    };
  }, [resolvedParams.id, dispatch, showError]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center py-12">
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
        return <JobOverview />;
      case 'questions':
        return <QuestionManager />;
      case 'candidates':
        return <JobCandidates />;
      case 'shortlisted':
        return <JobShortlisted jobId={job.id} />;
      default:
        return <JobOverview />;
    }
  };

  return (
    <JobDetailsLayout
      job={job}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onShareJob={() => shareJob(job, company?.slug || '')}
    >
      {renderTabContent()}
    </JobDetailsLayout>
  );
}
