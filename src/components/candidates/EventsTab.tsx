import React, { useEffect } from 'react';
import { CandidateWithEvaluation } from '@/types/candidates';
import { UpcomingInterview } from '@/store/dashboard/dashboardSlice';
import InterviewCard from '../dashboard/InterviewCard';
import { Button } from '../ui/button';
import { fetchApplicationEvents } from '@/store/interviews/interviewsThunks';
import { clearApplicationEvents } from '@/store/interviews/interviewsSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectApplicationEvents } from '@/store/interviews/interviewsSelectors';
import { Loader2, RefreshCw } from 'lucide-react';

interface EventsTabProps {
  candidate: CandidateWithEvaluation;
  onScheduleEvent?: () => void;
  onRefreshEvents?: () => void;
}

const EventsTab: React.FC<EventsTabProps> = ({ candidate, onScheduleEvent, onRefreshEvents }) => {
  const dispatch = useAppDispatch();
  const applicationEvents = useAppSelector(selectApplicationEvents);
  const loading = useAppSelector((state) => state.interviews.isLoading);

  useEffect(() => {
    if (candidate.id) {
      dispatch(fetchApplicationEvents(candidate.id));
    }

    return () => {
      dispatch(clearApplicationEvents());
    };
  }, [dispatch, candidate.id]);

  const handleRefresh = () => {
    if (onRefreshEvents) {
      onRefreshEvents();
    } else if (candidate.id) {
      dispatch(fetchApplicationEvents(candidate.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-6">
        {/* Application Events */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Application Events</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {onScheduleEvent && (
                <Button variant="outline" size="sm" onClick={onScheduleEvent}>
                  Schedule Event
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3 min-h-[290px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading events...</span>
              </div>
            ) : applicationEvents.length > 0 ? (
              applicationEvents.map((event) => {
                // Safely access event properties with null checks
                const safeEvent = event || {};
                const eventInterviewer = (safeEvent as any)?.interviewer;

                return (
                  <InterviewCard
                    key={safeEvent.id || Math.random()}
                    interview={
                      {
                        interview_id: safeEvent.id || '',
                        candidate_id: candidate?.id || '',
                        job_id: candidate?.jobId || '',
                        interview_date: safeEvent.date || '',
                        interview_time: safeEvent.time || '00:00',
                        interview_status: safeEvent.status || 'scheduled',
                        candidate_first_name: candidate?.firstName || '',
                        candidate_last_name: candidate?.lastName || '',
                        candidate_email: candidate?.email || '',
                        job_title: candidate?.jobTitle || '',
                        meet_link:
                          (safeEvent as any)?.meetingLink || (safeEvent as any)?.meeting_link || '',
                        event_summary: safeEvent.notes || (safeEvent as any)?.summary || '',
                      } as UpcomingInterview
                    }
                  />
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No application events found for this candidate.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsTab;
