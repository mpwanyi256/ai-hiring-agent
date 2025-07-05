'use client';

import { use, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchInterview } from "@/store/interview/interviewThunks";
import { selectInterviewStep, selectCandidate, loadedInterview } from "@/store/interview/interviewSelectors";
import InterviewIntro from "@/components/interview/InterviewIntro";
import CandidateInfoForm from "@/components/interview/CandidateInfoForm";
import { InterviewStep } from "@/types/interview";
import InterviewComplete from "@/components/interview/InterviewComplete";
import ResumeUpload from "@/components/interview/ResumeUpload";
import InterviewFlow from "@/components/interview/InterviewFlow";

interface InterviewPageProps {
  params: Promise<{
    token: string;
  }>;
}

const interviewSteps: Record<number, InterviewStep> = {
  1: 'intro',
  2: 'info',
  3: 'resume',
  4: 'interview',
  5: 'complete',
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const { token } = use(params);
  const dispatch = useAppDispatch();
  const interviewStep = useAppSelector(selectInterviewStep);
  const candidate = useAppSelector(selectCandidate);
  const job = useAppSelector(loadedInterview);

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
              candidateId={candidate.id}
              candidateInfo={{
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                email: candidate.email,
              }}
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
  }

  useEffect(() => {
    dispatch(fetchInterview(token));
  }, [token, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {candidate?.isCompleted ? <InterviewComplete /> : renderStep()}
    </div>
  );
}
