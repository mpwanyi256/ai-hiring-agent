import { CheckIcon, ChevronDownIcon, StarIcon } from '@heroicons/react/24/outline';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

import { DropdownMenu } from '../ui/dropdown-menu';
import { CandidateStatus } from '@/types/candidates';
import { apiError } from '@/lib/notification';
import { useState } from 'react';
import { updateCandidateStatus } from '@/store/candidates/candidatesThunks';
import { apiSuccess } from '@/lib/notification';
import { useAppDispatch } from '@/store';
import LoadingSpinner from '../ui/LoadingSpinner';

const candidateStatuses: { value: CandidateStatus; label: string }[] = [
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'reference_check', label: 'Reference Check' },
  { value: 'offer_extended', label: 'Offer Extended' },
  { value: 'offer_accepted', label: 'Offer Accepted' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'interview_scheduled':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

interface UpdateApplicationStatusProps {
  candidateId: string;
  status: CandidateStatus;
  onUpdating?: () => void;
  onUpdated?: (status: CandidateStatus) => void;
}

export const UpdateApplicationStatus: React.FC<UpdateApplicationStatusProps> = ({
  candidateId,
  status,
  onUpdating,
  onUpdated,
}) => {
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    try {
      setStatusUpdating(true);
      await dispatch(updateCandidateStatus({ candidateId, status: newStatus })).unwrap();
      apiSuccess('Candidate status updated successfully');
      onUpdated?.(newStatus);
    } catch (error) {
      apiError('Failed to update candidate status');
      console.error('Failed to update candidate status:', error);
    } finally {
      onUpdating?.();
      setStatusUpdating(false);
    }
  };

  if (statusUpdating) {
    return (
      <div className="flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="px-6 py-4 whitespace-nowrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium hover:cursor-pointer ${getStatusColor(status)}`}
          >
            <StarIcon className="w-3 h-3 mr-1" />
            {status?.replace('_', ' ').toUpperCase()}
            <ChevronDownIcon className="w-3 h-3 ml-1" />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {candidateStatuses.map((statusItem) => (
            <DropdownMenuItem
              key={statusItem.value}
              onClick={() => handleStatusChange(statusItem.value)}
              disabled={statusUpdating}
              className="flex items-center justify-between"
            >
              <span>{statusItem.label}</span>
              {status === statusItem.value && <CheckIcon className="w-4 h-4 text-green-500" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
