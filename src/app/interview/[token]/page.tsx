'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { JobData } from '@/lib/services/jobsService';
import InterviewFlow from '@/components/interview/InterviewFlow';
import InterviewComplete from '@/components/interview/InterviewComplete';
import ResumeUpload from '@/components/interview/ResumeUpload';
import InterviewIntro from '@/components/interview/InterviewIntro';
import CandidateInfoForm from '@/components/interview/CandidateInfoForm';
import { ResumeEvaluation } from '@/types/interview';

interface PageProps {
  params: Promise<{ token: string }>;
}

type InterviewStep = 'intro' | 'info' | 'resume' | 'interview' | 'complete';

export default function InterviewPage({ params }: PageProps) {
  const [job, setJob] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<InterviewStep>('intro');
  const [candidateInfo, setCandidateInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [resumeEvaluation, setResumeEvaluation] = useState<ResumeEvaluation | null>(null);
  const [resumeContent, setResumeContent] = useState<string>('');
  const [resolvedParams, setResolvedParams] = useState<{ token: string } | null>(null);

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Fetch job data
  useEffect(() => {
    if (!resolvedParams?.token) return;

    const fetchJob = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/jobs/interview/${resolvedParams.token}`);
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
  }, [resolvedParams]);

  const handleStartInterview = () => {
    setCurrentStep('info');
  };

  const handleCandidateInfoSubmit = (candidateId: string) => {
    setCandidateId(candidateId);
    setCurrentStep('resume');
  };

  const handleResumeEvaluationComplete = (evaluation: ResumeEvaluation, content: string) => {
    setResumeEvaluation(evaluation);
    setResumeContent(content);
    
    if (evaluation.passesThreshold) {
      setCurrentStep('interview');
    }
    // If evaluation fails, user stays on resume upload step with results
  };

  const handleInterviewComplete = () => {
    setCurrentStep('complete');
  };

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

  if (!job || !resolvedParams) return null;

  // Show interview completion
  if (currentStep === 'complete') {
    return <InterviewComplete job={job} />;
  }

  // Show actual interview (after resume evaluation passes)
  if (currentStep === 'interview' && resumeEvaluation?.passesThreshold && candidateId) {
    return (
      <InterviewFlow 
        jobToken={resolvedParams.token}
        job={job}
        candidateId={candidateId}
        candidateInfo={candidateInfo}
        resumeEvaluation={resumeEvaluation}
        resumeContent={resumeContent}
        onComplete={handleInterviewComplete}
      />
    );
  }

  // Show resume upload step
  if (currentStep === 'resume' && candidateId) {
    return (
      <ResumeUpload
        jobToken={resolvedParams.token}
        job={job}
        candidateId={candidateId}
        candidateInfo={candidateInfo}
        onEvaluationComplete={handleResumeEvaluationComplete}
      />
    );
  }

  // Show candidate info form
  if (currentStep === 'info') {
    return (
      <CandidateInfoForm
        candidateInfo={candidateInfo}
        setCandidateInfo={setCandidateInfo}
        jobToken={resolvedParams.token}
        onSubmit={handleCandidateInfoSubmit}
        onBack={() => setCurrentStep('intro')}
      />
    );
  }

  // Show interview introduction (default)
  return (
    <InterviewIntro 
      job={job}
      onStartInterview={handleStartInterview}
    />
  );
} 