import React, { useState } from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import { UpcomingInterview } from '@/store/dashboard/dashboardSlice';
import { Button } from '../ui/button';
import { Settings } from 'lucide-react';
import RescheduleInterviewModal from './RescheduleInterviewModal';

interface InterviewCardProps {
  interview: UpcomingInterview;
}

export default function InterviewCard({ interview }: InterviewCardProps) {
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  return (
    <>
      <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
        {/* Calendar Icon */}
        <div className="flex flex-col items-center justify-center w-14 h-16 rounded-lg bg-primary-100 border border-primary-200 mr-2 flex-shrink-0">
          <div className="w-full bg-primary rounded-t-lg text-white text-xs font-semibold text-center py-1">
            {new Date(interview.interview_date).toLocaleString('en-US', { month: 'short' })}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-2xl font-bold text-gray-900 text-center leading-none">
              {parseInt(interview.interview_date.split('-')[2], 10)}
            </div>
            <div className="text-xs text-gray-500 text-center">
              {new Date(interview.interview_date).toLocaleString('en-US', { weekday: 'short' })}
            </div>
          </div>
        </div>
        {/* Interview Info */}
        <div className="flex-1 min-w-0 border-l border-gray-200 pl-4">
          <div className="flex flex-col gap-1 font-medium text-gray-900 pb-2">
            <span className="text-primary">
              {interview.candidate_first_name} {interview.candidate_last_name}
            </span>
            <span className="text-xs text-gray-500">{interview.candidate_email}</span>
          </div>
          <div className="text-xs text-gray-600 max-w-[200px] truncate">
            {interview.event_summary}
          </div>
          <div className="text-sm text-gray-600">{interview.job_title}</div>
          <div className="text-xs text-gray-500 mt-1">
            {interview.interview_date} at {interview.interview_time.slice(0, 5)}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${interview.interview_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
            >
              {interview.interview_status.replace('_', ' ')}
            </span>
          </div>
        </div>
        {/* Meet Link */}
        {interview.meet_link && (
          <a
            href={interview.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-green-700 hover:underline ml-2"
          >
            <VideoCameraIcon className="w-4 h-4 mr-1 text-green-600" />
            Join Meet
          </a>
        )}

        {/* Event Details Button */}
        <div className="flex items-center ml-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRescheduleModal(true)}
            className="h-7 px-2"
          >
            <Settings className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>
      </div>

      {/* Reschedule Interview Modal */}
      {showRescheduleModal && (
        <RescheduleInterviewModal
          isOpen={showRescheduleModal}
          interview={{
            interview_id: interview.interview_id,
            candidate_id: interview.candidate_id || '',
            job_id: interview.job_id || '',
            candidate_first_name: interview.candidate_first_name,
            candidate_last_name: interview.candidate_last_name,
            job_title: interview.job_title,
            interview_date: interview.interview_date,
            interview_time: interview.interview_time,
            notes: interview.event_summary,
            meet_link: interview.meet_link,
          }}
          onClose={() => setShowRescheduleModal(false)}
        />
      )}
    </>
  );
}
