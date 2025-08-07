import { useAppSelector, useAppDispatch } from '@/store';
import { loadedInterview, selectCandidate } from '@/store/interview/interviewSelectors';
import CandidateInfoForm from '@/components/interview/CandidateInfoForm';
import ResumeUpload from '@/components/interview/ResumeUpload';
import InterviewFlow from '@/components/interview/InterviewFlow';
import InterviewComplete from '@/components/interview/InterviewComplete';
import { useEffect, useState } from 'react';
import { getResumeEvaluation } from '@/store/evaluation/evaluationThunks';
import { InterviewEvaluation } from '@/types/interview';

export default function JobApplicationTab() {
  const job = useAppSelector(loadedInterview);
  const candidate = useAppSelector(selectCandidate);
  const dispatch = useAppDispatch();

  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);
  const [evaluationChecked, setEvaluationChecked] = useState(false);

  // Check for existing evaluation when candidate data is available
  useEffect(() => {
    const checkEvaluation = async () => {
      if (!candidate?.id || !candidate?.jobId || evaluationChecked) return;

      setIsLoadingEvaluation(true);
      try {
        const evaluationResult = await dispatch(
          getResumeEvaluation({
            candidateId: candidate.id,
            jobId: candidate.jobId,
          }),
        ).unwrap();

        setEvaluation(evaluationResult);
        setEvaluationChecked(true);
      } catch (error) {
        console.error('Error checking evaluation:', error);
        setEvaluation(null);
        setEvaluationChecked(true);
      } finally {
        setIsLoadingEvaluation(false);
      }
    };

    checkEvaluation();
  }, [candidate?.id, candidate?.jobId, dispatch, evaluationChecked]);

  // Reset evaluation check when candidate changes
  useEffect(() => {
    setEvaluationChecked(false);
    setEvaluation(null);
  }, [candidate?.id]);

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-text">Loading job details...</p>
        </div>
      </div>
    );
  }

  const jobToken = job.interviewToken;

  // Data-driven rendering logic
  const renderComponent = () => {
    // 1. If candidate is completed, show completion
    if (candidate?.isCompleted) {
      return <InterviewComplete />;
    }

    // 2. If no candidate data, show info form
    if (!candidate) {
      return <CandidateInfoForm jobToken={jobToken} />;
    }

    // 3. If we're still loading evaluation, show loading
    if (isLoadingEvaluation) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-text">Checking your application status...</p>
          </div>
        </div>
      );
    }

    // 4. If candidate has a passing evaluation, show interview questions
    if (evaluation) {
      const score = evaluation.resumeScore ?? evaluation.score;
      if (score !== undefined && score >= 50) {
        return (
          <InterviewFlow
            jobToken={jobToken}
            job={job}
            resumeContent=""
            onComplete={() => {
              // Handle completion - could update candidate status
              console.log('Interview completed');
            }}
          />
        );
      }
    }

    // 5. Default: show resume upload (no evaluation or failed evaluation)
    return (
      <ResumeUpload
        jobToken={jobToken}
        onEvaluationCompleted={() => {
          // Force re-check of evaluation when new one is completed
          setEvaluationChecked(false);
        }}
      />
    );
  };

  return <div className="">{renderComponent()}</div>;
}
