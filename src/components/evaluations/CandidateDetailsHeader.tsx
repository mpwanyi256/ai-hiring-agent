import { useState } from 'react';
import { apiSuccess, apiError } from '@/lib/notification';
import { CandidateBasic, CandidateStatus } from '@/types';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

type CandidateDetailsProps = {
  candidate: CandidateBasic;
};

const statusOptions: { value: CandidateStatus; label: string; color: string }[] = [
  { value: 'under_review', label: 'Under Review', color: 'bg-gray-100 text-gray-800' },
  { value: 'shortlisted', label: 'Shortlist', color: 'bg-green-100 text-green-800' },
  {
    value: 'interview_scheduled',
    label: 'Interview Scheduled',
    color: 'bg-blue-100 text-blue-800',
  },
  { value: 'reference_check', label: 'Reference Check', color: 'bg-purple-100 text-purple-800' },
  { value: 'offer_extended', label: 'Offer Extended', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'offer_accepted', label: 'Offer Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'hired', label: 'Hired', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' },
];

export const CandidateDetailsHeader = ({ candidate }: CandidateDetailsProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<CandidateStatus>(candidate.status);

  const handleStatusUpdate = async (newStatus: CandidateStatus) => {
    if (newStatus === currentStatus) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        setCurrentStatus(newStatus);
        apiSuccess(
          `Candidate status updated to ${statusOptions.find((opt) => opt.value === newStatus)?.label}`,
        );
      } else {
        apiError(data.error || 'Failed to update candidate status');
      }
    } catch (error) {
      apiError('Failed to update candidate status');
      console.error('Error updating candidate status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary via-green-600 to-primary rounded-t-lg p-6 text-white relative overflow-hidden flex-shrink-0">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-green-500/20"></div>
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">
                {`${candidate.firstName} ${candidate.lastName}`?.charAt(0).toUpperCase() ||
                  candidate.email?.charAt(0).toUpperCase() ||
                  'A'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {`${candidate.firstName} ${candidate.lastName}`}
              </h2>
              <p className="text-green-100">{candidate.email}</p>
            </div>
          </div>
          {/* Status Dropdown (shadcn/ui Select) */}
          <div className="min-w-[200px]">
            <Select
              value={currentStatus}
              onValueChange={(value) => handleStatusUpdate(value as CandidateStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${option.color}`}
                    >
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};
