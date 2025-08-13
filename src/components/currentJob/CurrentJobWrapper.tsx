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
import { useToast } from '../providers/ToastProvider';
import { setSelectedCandidate } from '@/store/selectedCandidate/selectedCandidateSlice';
import { selectCompany } from '@/store/company/companySelectors';
import { PermissionAccessWrapper } from '../layout/PermissionAccessWrapper';
import { PageLoadingWrapper } from '../layout/PageLoadingWrapper';

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

    const fetchJobDetails = async () => {
      try {
        await dispatch(fetchJobById(resolvedParams.id)).unwrap();
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();

    return () => {
      // Clean up function to reset the current job when the component unmounts
      dispatch(resetCurrentJob());
      dispatch(setSelectedCandidate(null));
    };
  }, [resolvedParams.id, dispatch, showError]);

  if (loading) {
    return <PageLoadingWrapper message="Loading job details..." />;
  }

  if (error || !job) {
    return (
      <PermissionAccessWrapper
        title="Job Not Found"
        message={
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
