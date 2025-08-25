import React, { useEffect, useCallback } from 'react';
import { CandidateWithEvaluation } from '@/types/candidates';
import { UpcomingInterview } from '@/store/dashboard/dashboardSlice';
import InterviewCard from '../dashboard/InterviewCard';
import { Button } from '../ui/button';
import { fetchApplicationEvents } from '@/store/interviews/interviewsThunks';
import { clearApplicationEvents } from '@/store/interviews/interviewsSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectApplicationEvents } from '@/store/interviews/interviewsSelectors';
import { Loader2, RefreshCw } from 'lucide-react';
import { IntegrationByProvider } from '@/store/integrations/integrationsSelectors';
import { ConnectProviderButton } from '../generics/ConnectProviderButton';
import Image from 'next/image';
import { useAnalytics } from '@/hooks/useAnalytics';

interface EventsTabProps {
  candidate: CandidateWithEvaluation;
  onScheduleEvent?: () => void;
  onRefreshEvents?: () => void;
}

const EventsTab: React.FC<EventsTabProps> = ({ candidate, onScheduleEvent, onRefreshEvents }) => {
  const dispatch = useAppDispatch();
  const applicationEvents = useAppSelector(selectApplicationEvents);
  const loading = useAppSelector((state) => state.interviews.isLoading);
  const googleIntegration = useAppSelector(IntegrationByProvider('google'));

  // Initialize analytics tracking
  const analytics = useAnalytics();

  useEffect(() => {
    if (candidate.id) {
      dispatch(fetchApplicationEvents(candidate.id));
      // Track candidate page view
      analytics.trackCandidatePage(candidate.id, 'view_events');
    }

    return () => {
      dispatch(clearApplicationEvents());
    };
  }, [dispatch, candidate.id]);

  const handleRefresh = useCallback(() => {
    if (onRefreshEvents) {
      onRefreshEvents();
    } else if (candidate.id) {
      dispatch(fetchApplicationEvents(candidate.id));
    }
    // Track refresh action
    analytics.trackFeatureUsage('events_refresh', 'refresh');
  }, [onRefreshEvents, candidate.id, dispatch, analytics]);

  const handleScheduleEvent = useCallback(() => {
    if (onScheduleEvent) {
      onScheduleEvent();
      // Track event scheduling
      analytics.trackInterviewScheduled(candidate.id, 'manual');
    }
  }, [onScheduleEvent, candidate.id, analytics]);

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
                <>
                  {!googleIntegration?.access_token ? (
                    <ConnectProviderButton provider="google" />
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleScheduleEvent}>
                      <Image
                        src="/illustrations/google_calendar.svg"
                        alt="Google Calendar"
                        width={20}
                        height={20}
                      />
                      Schedule Event
                    </Button>
                  )}
                </>
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
