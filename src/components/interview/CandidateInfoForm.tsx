'use client';

import { useState } from 'react';
import { BriefcaseIcon } from '@heroicons/react/24/outline';
import { useAppDispatch } from '@/store';
import { getCandidateDetails } from '@/store/interview/interviewThunks';
import { setInterviewStep } from '@/store/interview/interviewSlice';
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

  const handleBack = () => {
    dispatch(setInterviewStep(1));
  };

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

      // Check for isCompleted and evaluation logic
      if ('isCompleted' in candidate && candidate.isCompleted) {
        dispatch(setInterviewStep(5)); // Step 5: Interview complete/results
        return;
      }

      // Type guard for evaluation property
      if ('evaluation' in candidate && candidate.evaluation) {
        const evaluation = candidate.evaluation as { resumeScore?: number; score?: number };
        // Prefer resumeScore if available, otherwise use score
        const score = evaluation?.resumeScore ?? evaluation?.score;
        if (score !== undefined && score >= 50) {
          dispatch(setInterviewStep(4)); // Step 4: Interview questions
        } else {
          dispatch(setInterviewStep(5)); // Step 5: Results/failure
        }
        return;
      }

      // If no evaluation, go to resume upload
      dispatch(setInterviewStep(3));
    } catch (err) {
      console.error('Error saving candidate info:', err);
      setError('Something went wrong. Please try again.');
      apiError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <BriefcaseIcon className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-2">Let&apos;s Get Started</h1>
          <p className="text-muted-text">
            Please provide your basic information before we begin the interview process.
          </p>
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

        <div className="mt-6 text-center">
          <button
            onClick={handleBack}
            disabled={isLoading}
            className="text-primary hover:text-primary/80 text-sm disabled:text-primary/50"
          >
            ← Back to Job Details
          </button>
        </div>
      </div>
    </div>
  );
}
