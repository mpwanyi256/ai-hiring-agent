'use client';

import { use, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchInterview } from "@/store/interview/interviewThunks";
import { selectInterview, selectInterviewStep } from "@/store/interview/interviewSelectors";
import InterviewIntro from "@/components/interview/InterviewIntro";

interface InterviewPageProps {
  params: Promise<{
    token: string;
  }>;
}

type InterviewStep = 'intro' | 'info' | 'resume' | 'interview' | 'complete';

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

  useEffect(() => {
    dispatch(fetchInterview(token));
  }, [token, dispatch]);

  const currentStep = interviewSteps;  

  return (<InterviewIntro />);
}
