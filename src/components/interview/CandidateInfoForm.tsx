'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/store';
import { getCandidateDetails } from '@/store/interview/interviewThunks';
import { apiError } from '@/lib/notification';

interface CandidateInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface CandidateInfoFormProps {
  jobToken: string;
}

export default function CandidateInfoForm({ jobToken }: CandidateInfoFormProps) {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    firstName: '',
    lastName: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !candidateInfo.firstName.trim() ||
      !candidateInfo.lastName.trim() ||
      !candidateInfo.email.trim()
    ) {
      setError('Please enter your first name, last name, and email');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const candidate = await dispatch(
        getCandidateDetails({
          jobToken,
          email: candidateInfo.email,
          firstName: candidateInfo.firstName,
          lastName: candidateInfo.lastName,
        }),
      ).unwrap();

      // Data is now saved and will be picked up by JobApplicationTab
      // The JobApplicationTab will automatically render the correct component
      // based on the candidate data and evaluation status
      console.log('Candidate details saved:', candidate);
    } catch (err) {
      console.error('Error saving candidate info:', err);
      setError('Something went wrong. Please try again.');
      apiError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-md w-full">
        <div className="mb-6">
          <p className="text-muted-text">Please provide your basic information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">First Name *</label>
            <input
              type="text"
              value={candidateInfo.firstName}
              onChange={(e) => setCandidateInfo({ ...candidateInfo, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Last Name</label>
            <input
              type="text"
              value={candidateInfo.lastName}
              onChange={(e) => setCandidateInfo({ ...candidateInfo, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Email Address</label>
            <input
              type="email"
              value={candidateInfo.email}
              onChange={(e) => setCandidateInfo({ ...candidateInfo, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="your.email@example.com"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg">
              <p className="text-accent-red text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
