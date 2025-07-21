import React from 'react';
import CandidateEventsCalendar, { CandidateEvent } from '../ui/CandidateEventsCalendar';

const mockEvents: CandidateEvent[] = [
  { date: '2025-07-02', type: 'interview', label: 'Interview' },
  { date: '2025-07-03', type: 'review', label: 'Review' },
  { date: '2025-07-12', type: 'task', label: 'Task' },
  { date: '2025-07-16', type: 'interview', label: 'Interview' },
];

const legend = [
  { type: 'interview', color: 'bg-blue-500', label: 'Interview' },
  { type: 'review', color: 'bg-yellow-500', label: 'Review' },
  { type: 'task', color: 'bg-green-500', label: 'Task' },
];

const EventsTab: React.FC = () => (
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
    <CandidateEventsCalendar events={mockEvents} />
  </div>
);

export default EventsTab;
