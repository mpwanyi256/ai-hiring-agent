'use client';

import { use, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchInterview } from '@/store/interview/interviewThunks';
import {
  selectInterviewStep,
  selectCandidate,
  loadedInterview,
} from '@/store/interview/interviewSelectors';
import InterviewIntro from '@/components/interview/InterviewIntro';
import CandidateInfoForm from '@/components/interview/CandidateInfoForm';
import InterviewComplete from '@/components/interview/InterviewComplete';
import ResumeUpload from '@/components/interview/ResumeUpload';
import InterviewFlow from '@/components/interview/InterviewFlow';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface InterviewPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const { token } = use(params);
  const dispatch = useAppDispatch();
  const interviewStep = useAppSelector(selectInterviewStep);
  const candidate = useAppSelector(selectCandidate);
  const job = useAppSelector(loadedInterview);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('Candidate dat', candidate);

  const renderStep = () => {
    switch (interviewStep) {
      case 1:
        return <InterviewIntro />;
      case 2:
        return <CandidateInfoForm jobToken={token} />;
      case 3:
        return <ResumeUpload jobToken={token} />;
      case 4:
        // Only render interview if we have candidate and job data
        if (candidate && job) {
          return (
            <InterviewFlow
              jobToken={token}
              job={job}
              resumeEvaluation={null} // Will be fetched by InterviewFlow
              resumeContent=""
              onComplete={() => {
                // This will be handled by the InterviewFlow component
                // which will update the step to 5
              }}
            />
          );
        }
        return <div>Loading interview...</div>;
      case 5:
        return <InterviewComplete />;
      default:
        return <InterviewIntro />;
    }
  };

  useEffect(() => {
    const loadInterview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await dispatch(fetchInterview(token)).unwrap();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load interview';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadInterview();
  }, [token, dispatch]);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Interview Not Available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="text-sm text-gray-500">
            <p>If you believe this is an error, please contact the hiring team.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {candidate?.isCompleted ? <InterviewComplete /> : renderStep()}
    </div>
  );
}
