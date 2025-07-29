import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClockIcon, UserIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { InterviewType, CreateInterviewScheduleRequest } from '@/types/interview';

interface InterviewSchedulerProps {
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  onScheduled: () => void;
  onCancel: () => void;
}
export default function InterviewScheduler({
  candidateId,
  candidateName,
  jobTitle,
  onScheduled,
  onCancel,
}: InterviewSchedulerProps) {
  const [schedule, setSchedule] = useState<Omit<CreateInterviewScheduleRequest, 'candidateId'>>({
    date: '',
    time: '',
    duration: 30,
    type: 'video',
    location: '',
    notes: '',
  });
  const [isScheduling, setIsScheduling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true);

    try {
      const response = await fetch('/api/interviews/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          ...schedule,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule interview');
      }

      onScheduled();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      // Handle error - show toast notification
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-light p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Interview</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <UserIcon className="w-4 h-4 mr-1" />
            {candidateName}
          </div>
          <div className="flex items-center">
            <MapPinIcon className="w-4 h-4 mr-1" />
            {jobTitle}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                required
                value={schedule.date}
                onChange={(e) => setSchedule({ ...schedule, date: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-light rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <div className="relative">
              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="time"
                required
                value={schedule.time}
                onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-light rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Duration and Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <select
              value={schedule.duration}
              onChange={(e) => setSchedule({ ...schedule, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-light rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interview Type</label>
            <select
              value={schedule.type}
              onChange={(e) => setSchedule({ ...schedule, type: e.target.value as InterviewType })}
              className="w-full px-3 py-2 border border-gray-light rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
              <option value="in_person">In Person</option>
            </select>
          </div>
        </div>

        {/* Location (for in-person interviews) */}
        {schedule.type === 'in_person' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              placeholder="Enter interview location"
              value={schedule.location}
              onChange={(e) => setSchedule({ ...schedule, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-light rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea
            rows={3}
            placeholder="Any additional information for the candidate..."
            value={schedule.notes}
            onChange={(e) => setSchedule({ ...schedule, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-light rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isScheduling}>
            Cancel
          </Button>
          <Button type="submit" disabled={isScheduling || !schedule.date || !schedule.time}>
            {isScheduling ? 'Scheduling...' : 'Schedule Interview'}
          </Button>
        </div>
      </form>
    </div>
  );
}
