'use client';

import { use, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchInterview } from "@/store/interview/interviewThunks";
import { selectInterviewStep } from "@/store/interview/interviewSelectors";
import InterviewIntro from "@/components/interview/InterviewIntro";
import CandidateInfoForm from "@/components/interview/CandidateInfoForm";
import { InterviewStep } from "@/types/interview";
import InterviewComplete from "@/components/interview/InterviewComplete";
import ResumeUpload from "@/components/interview/ResumeUpload";

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

  const renderStep = () => {
    switch (interviewStep) {
      case 1:
        return <InterviewIntro />;
      case 2:
        return <CandidateInfoForm jobToken={token} />;
      case 3:
        return <ResumeUpload jobToken={token} />;
      // case 4:
      //   return <InterviewInterview />;
      case 5:
        return <InterviewComplete />;
    }
  }

  useEffect(() => {
    dispatch(fetchInterview(token));
  }, [token, dispatch]);

  const currentStep = interviewSteps;  

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {renderStep()}
    </div>
  );
}
