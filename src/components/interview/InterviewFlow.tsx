'use client';

import { useEffect } from 'react';
import { JobData } from '@/lib/services/jobsService';
import { ResumeEvaluation } from '@/types/interview';

interface InterviewFlowProps {
  jobToken: string;
  job: JobData;
  candidateInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  resumeEvaluation: ResumeEvaluation;
  resumeContent: string;
  onComplete: () => void;
}

export default function InterviewFlow({ resumeEvaluation, onComplete }: InterviewFlowProps) {
  // TODO: Update this component to work with the new architecture
  // For now, show a placeholder that completes immediately
  
  useEffect(() => {
    // Auto-complete for now since we need to update the entire flow
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-text mb-2">Preparing Interview Questions</h2>
        <p className="text-muted-text mb-4">
          Based on your resume evaluation (Score: {resumeEvaluation.score}/100), we&apos;re generating personalized questions...
        </p>
        <p className="text-sm text-muted-text">
          This is a placeholder - the interview flow will be updated to use the new question system.
        </p>
      </div>
    </div>
  );
} 