import React, { useEffect, useState } from 'react';
import { CandidateWithEvaluation } from '@/types/candidates';
import InterviewCard from '../dashboard/InterviewCard';
import Button from '../ui/Button';
import { fetchApplicationEvents } from '@/store/interviews/interviewsThunks';
import { clearApplicationEvents } from '@/store/interviews/interviewsSlice';
import { useAppSelector } from '@/store';
import { useAppDispatch } from '@/store';
import { Loader2 } from 'lucide-react';

const GeneralTab: React.FC<{
  candidate: CandidateWithEvaluation;
  onScheduleEvent?: () => void;
}> = ({ candidate, onScheduleEvent }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const applicationEvents = useAppSelector((state) => state.interviews.applicationEvents);

  useEffect(() => {
    setIsLoading(true);
    dispatch(fetchApplicationEvents(candidate.id)).finally(() => {
      setIsLoading(false);
    });

    return () => {
      dispatch(clearApplicationEvents());
    };
  }, [candidate.id, dispatch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-350px)]">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-1 text-primary-700">{`Events with ${candidate.firstName} ${candidate.lastName}`}</h4>
        <div className="flex flex-col gap-2 h-[calc(100vh-350px)] overflow-y-auto">
          {applicationEvents.length > 0 ? (
            applicationEvents.map((event) => (
              <InterviewCard
                key={event.id}
                interview={{
                  interview_id: event.id,
                  candidate_id: candidate.id,
                  interview_date: event.date,
                  interview_time: event.time,
                  interview_status: event.status,
                  candidate_first_name: candidate.firstName,
                  candidate_last_name: candidate.lastName,
                  candidate_email: candidate.email,
                  job_title: event.jobTitle,
                  event_summary: event.eventSummary,
                  meet_link: event.meetingLink || undefined,
                  job_id: event.jobId,
                }}
              />
            ))
          ) : (
            <div className="text-gray-400 text-sm">No interview scheduled.</div>
          )}
        </div>
      </div>
      {onScheduleEvent && (
        <Button variant="primary" size="sm" className="mb-2" onClick={onScheduleEvent}>
          Schedule new Event
        </Button>
      )}
    </div>
  );
};

export default GeneralTab;
