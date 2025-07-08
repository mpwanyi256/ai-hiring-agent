'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { JobData } from '@/lib/services/jobsService';
import InterviewFlow from '@/components/interview/InterviewFlow';
import InterviewComplete from '@/components/interview/InterviewComplete';
import ResumeUpload from '@/components/interview/ResumeUpload';
import InterviewIntro from '@/components/interview/InterviewIntro';
import CandidateInfoForm from '@/components/interview/CandidateInfoForm';

type pageParams = {
  token: string;
};

type InterviewStep = 'intro' | 'info' | 'resume' | 'interview' | 'complete';

export default function InterviewPage() {
  const pageParams = useParams<pageParams>();
  console.log(pageParams);
  const [job, setJob] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<InterviewStep>('intro');

  // Fetch job data
  useEffect(() => {
    if (!pageParams.token) return;

    const fetchJob = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/jobs/interview/${pageParams.token}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Interview link not found');
          return;
        }

        setJob(data.job);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Failed to load interview');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [pageParams.token]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-text">Loading interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !job) {
    return notFound();
  }

  if (!job) return null;

  // Show interview completion
  if (currentStep === 'complete') {
    return <InterviewComplete />;
  }

  // Show actual interview (after resume evaluation passes)
  if (currentStep === 'interview' && job) {
    return (
      <InterviewFlow
        jobToken={pageParams.token}
        job={job}
        resumeContent={''}
        onComplete={() => setCurrentStep('complete')}
      />
    );
  }

  // Show resume upload step
  if (currentStep === 'resume') {
    return <ResumeUpload jobToken={pageParams.token} />;
  }

  // Show candidate info form
  if (currentStep === 'info') {
    return <CandidateInfoForm jobToken={pageParams.token} />;
  }

  // Show interview introduction (default)
  return <InterviewIntro />;
}
