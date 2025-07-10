import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectCurrentJob,
  selectJobQuestionsCount,
  selectJobsLoading,
} from '@/store/jobs/jobsSelectors';
import { EyeIcon, LinkIcon, PlayIcon, SparklesIcon, XCircleIcon } from 'lucide-react';
import Link from 'next/link';
import Button from '../ui/Button';
import { copyInterviewLink } from '@/lib/utils';
import { getJobStatusColor, getJobStatusLabel } from '@/lib/utils';
import { JobStatus } from '@/types/jobs';
import { updateJobStatus } from '@/store/jobs/jobsThunks';
import { useState } from 'react';
import { useToast } from '../providers/ToastProvider';
import { app } from '@/lib/constants';

interface CurrentJobHeaderProps {
  onSetActiveTab: (tab: string) => void;
}

export const CurrentJobHeader: React.FC<CurrentJobHeaderProps> = ({ onSetActiveTab }) => {
  const job = useAppSelector(selectCurrentJob);
  const isLoading = useAppSelector(selectJobsLoading);
  const questionsCount = useAppSelector(selectJobQuestionsCount);
  const dispatch = useAppDispatch();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { success, error: showError } = useToast();
  if (!job || isLoading) return null;

  const handleUpdateJobStatus = async (newStatus: JobStatus) => {
    if (!job) return;

    setIsUpdatingStatus(true);
    try {
      const result = await dispatch(
        updateJobStatus({
          jobId: job.id,
          status: newStatus,
        }),
      );

      if (updateJobStatus.rejected.match(result)) {
        throw new Error(result.error.message || 'Failed to update job status');
      }

      success(`Job status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating job status:', err);
      showError(err instanceof Error ? err.message : 'Failed to update job status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="p-6 border-b border-gray-light">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text mb-2">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-text">
            <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
            <span>{job.candidateCount || 0} candidates</span>
            <span className="capitalize">{job.interviewFormat} Interview</span>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full border ${getJobStatusColor(job.status)}`}
          >
            {getJobStatusLabel(job.status)}
          </span>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              job.isActive ? 'bg-primary/10 text-primary' : 'bg-gray-light text-muted-text'
            }`}
          >
            {job.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyInterviewLink(`${app.baseUrl}/interview/${job.interviewToken}`)}
          className="flex items-center"
        >
          <LinkIcon className="w-4 h-4 mr-1" />
          Copy Interview Link
        </Button>

        {job.status === 'draft' ? (
          <Button
            size="sm"
            onClick={() => handleUpdateJobStatus('interviewing')}
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
            onClick={() => handleUpdateJobStatus('closed')}
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
            onClick={() => handleUpdateJobStatus('interviewing')}
            disabled={isUpdatingStatus}
            className="flex items-center"
          >
            <PlayIcon className="w-4 h-4 mr-1" />
            {isUpdatingStatus ? 'Reopening...' : 'Reopen Position'}
          </Button>
        )}

        {questionsCount === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetActiveTab('questions')}
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
  );
};
