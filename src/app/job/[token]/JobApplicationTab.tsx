import { useAppSelector, useAppDispatch } from '@/store';
import {
  selectInterviewStep,
  loadedInterview,
  selectCandidate,
} from '@/store/interview/interviewSelectors';
import { setInterviewStep } from '@/store/interview/interviewSlice';
import CandidateInfoForm from '@/components/interview/CandidateInfoForm';
import ResumeUpload from '@/components/interview/ResumeUpload';
import InterviewFlow from '@/components/interview/InterviewFlow';
import InterviewComplete from '@/components/interview/InterviewComplete';

export default function JobApplicationTab() {
  const step = useAppSelector(selectInterviewStep);
  const job = useAppSelector(loadedInterview);
  const candidate = useAppSelector(selectCandidate);
  const dispatch = useAppDispatch();

  // Always start from step 2 (CandidateInfoForm)
  if (!job) return null;

  const jobToken = job.interviewToken;

  const renderStep = () => {
    switch (step) {
      case 2:
        return <CandidateInfoForm jobToken={jobToken} />;
      case 3:
        return <ResumeUpload jobToken={jobToken} />;
      case 4:
        if (candidate && job) {
          return (
            <InterviewFlow
              jobToken={jobToken}
              job={job}
              resumeContent=""
              onComplete={() => dispatch(setInterviewStep(5))}
            />
          );
        }
        return <div>Loading application...</div>;
      case 5:
        return <InterviewComplete />;
      default:
        // If step is 1, force to 2
        dispatch(setInterviewStep(2));
        return null;
    }
  };

  return <div className="">{renderStep()}</div>;
}
