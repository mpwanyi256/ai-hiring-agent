import { useState } from 'react';
import { apiSuccess, apiError } from "@/lib/notification";
import { CandidateBasic, CandidateStatus } from "@/types";
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type CandidateDetailsProps = {
  candidate: CandidateBasic;
}

const statusOptions: { value: CandidateStatus; label: string; color: string }[] = [
  { value: 'under_review', label: 'Under Review', color: 'bg-gray-100 text-gray-800' },
  { value: 'interview_scheduled', label: 'Interview Scheduled', color: 'bg-blue-100 text-blue-800' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-green-100 text-green-800' },
  { value: 'reference_check', label: 'Reference Check', color: 'bg-purple-100 text-purple-800' },
  { value: 'offer_extended', label: 'Offer Extended', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'offer_accepted', label: 'Offer Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'hired', label: 'Hired', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' },
];

export const CandidateDetailsHeader = ({ candidate }: CandidateDetailsProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const currentStatus = statusOptions.find(option => option.value === candidate.status) || statusOptions[0];

  const handleStatusUpdate = async (newStatus: CandidateStatus) => {
    if (newStatus === candidate.status) {
      setShowDropdown(false);
      return;
    }

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
        apiSuccess(`Candidate status updated to ${statusOptions.find(opt => opt.value === newStatus)?.label}`);
        // Trigger a page refresh to update the candidate data
        window.location.reload();
      } else {
        apiError(data.error || 'Failed to update candidate status');
      }
    } catch (error) {
      apiError('Failed to update candidate status');
      console.error('Error updating candidate status:', error);
    } finally {
      setIsUpdating(false);
      setShowDropdown(false);
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
                        candidate.email?.charAt(0).toUpperCase() || 'A'}
                    </span>
                </div>
                <div>
                    <h2 className="text-xl font-bold">
                    {`${candidate.firstName} ${candidate.lastName}`}
                    </h2>
                    <p className="text-green-100">{candidate.email}</p>
                </div>
              </div>
              
              {/* Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  disabled={isUpdating}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
                    {currentStatus.label}
                  </span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusUpdate(option.value)}
                          disabled={isUpdating}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            candidate.status === option.value ? 'bg-gray-50 font-medium' : ''
                          }`}
                        >
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
    </div>
  )
}