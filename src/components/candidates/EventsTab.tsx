import React from 'react';
import CandidateEventsCalendar, { CandidateEvent } from '../ui/CandidateEventsCalendar';
import { CandidateWithEvaluation } from '@/types/candidates';

const legend = [
  { type: 'interview', color: 'bg-blue-500', label: 'Interview' },
  { type: 'review', color: 'bg-yellow-500', label: 'Review' },
  { type: 'task', color: 'bg-green-500', label: 'Task' },
];

const EventsTab: React.FC<{ candidate: CandidateWithEvaluation }> = ({ candidate }) => {
  // For now, only use interviewDetails as an event
  const events: CandidateEvent[] = candidate.interviewDetails
    ? [
        {
          date: candidate.interviewDetails.date,
          type: 'interview',
          label: 'scheduled', // InterviewStatus value
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      <h4 className="font-medium mb-2 text-primary-700">Candidate Events</h4>
      <div className="flex gap-4 items-center mb-2">
        {legend.map((item) => (
          <div key={item.type} className="flex items-center gap-1 text-xs">
            <span className={`w-3 h-3 rounded-full ${item.color} inline-block`} />
            {item.label}
          </div>
        ))}
      </div>
      <CandidateEventsCalendar events={events} />
    </div>
  );
};

export default EventsTab;
