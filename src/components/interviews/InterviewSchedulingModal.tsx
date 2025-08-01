'use client';

import React, { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/store';
import { scheduleInterview, updateInterview } from '@/store/interviews/interviewsThunks';
import { selectIsInterviewScheduling } from '@/store/interviews/interviewsSelectors';
import { selectCompany, selectCompanyTimezones } from '@/store/company/companySelectors';
import { selectUser } from '@/store/auth/authSelectors';
import { CandidateWithEvaluation, InterviewDetails } from '@/types/candidates';
import { CreateInterviewData } from '@/types/interviews';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import DurationPicker from './DurationPicker';
import TimezonePicker from './TimezonePicker';
import { Button } from '../ui/button';
import Modal from '../ui/Modal';
import { apiSuccess } from '@/lib/notification';
import { Loading } from '@/components/ui/Loading';

interface InterviewSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateWithEvaluation;
  jobId: string;
  jobTitle: string;
  isEdit?: boolean;
  interview?: InterviewDetails | null;
}

const InterviewSchedulingModal: React.FC<InterviewSchedulingModalProps> = ({
  isOpen,
  onClose,
  candidate,
  jobId,
  jobTitle,
  isEdit = false,
  interview = null,
}) => {
  const dispatch = useAppDispatch();
  const company = useAppSelector(selectCompany);
  const isScheduling = useAppSelector((state) => selectIsInterviewScheduling(state, candidate.id));
  const user = useAppSelector(selectUser);

  const timezones = useAppSelector(selectCompanyTimezones);

  // Add a new loading state for all async actions
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState<CreateInterviewData>({
    applicationId: candidate.id,
    jobId: jobId,
    eventSummary: `Interview with ${candidate.firstName} ${candidate.lastName} for ${jobTitle}`,
    date: '',
    time: '09:00',
    timezoneId: '',
    duration: 30,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isEdit && interview) {
        setFormData({
          applicationId: candidate.id,
          jobId: jobId,
          eventSummary: `Event with ${candidate.firstName} ${candidate.lastName} for ${jobTitle}`,
          date: interview.date,
          time: interview.time,
          timezoneId: interview.timezone_id,
          duration: interview.duration,
          notes: interview.notes || '',
        });
      } else {
        const defaultTimezoneId =
          company?.timezoneId || timezones.find((tz) => tz.name === 'UTC')?.id || '';
        setFormData({
          applicationId: candidate.id,
          jobId: jobId,
          eventSummary: `Event with ${candidate.firstName} ${candidate.lastName} for ${jobTitle}`,
          date: '',
          time: '09:00',
          timezoneId: defaultTimezoneId,
          duration: 30,
          notes: '',
        });
      }
      setErrors({});
    }
  }, [
    isOpen,
    candidate.id,
    jobId,
    company?.timezoneId,
    timezones,
    isEdit,
    interview,
    jobTitle,
    candidate.firstName,
    candidate.lastName,
  ]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = 'Date cannot be in the past';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Time is required';
    }

    if (!formData.timezoneId) {
      newErrors.timezoneId = 'Timezone is required';
    }

    if (!formData.duration || formData.duration < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setActionLoading(true);
    try {
      if (isEdit && interview) {
        await dispatch(
          updateInterview({
            id: interview.id,
            ...formData,
          }),
        ).unwrap();
      } else {
        await dispatch(
          scheduleInterview({
            ...formData,
            employerEmail: user?.email || '',
          }),
        ).unwrap();
      }

      apiSuccess(isEdit ? 'Interview updated successfully' : 'Interview scheduled successfully');
      onClose();
    } catch (error) {
      console.error('Failed to schedule/update interview:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateInterviewData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatCandidateName = () => {
    return `${candidate.firstName} ${candidate.lastName}`;
  };

  const getSelectedTimezone = () => {
    return timezones.find((tz) => tz.id === formData.timezoneId);
  };

  const formatOffset = (hours: number, minutes: number) => {
    const sign = hours >= 0 ? '+' : '';
    const hourStr = Math.abs(hours).toString().padStart(2, '0');
    const minuteStr = minutes.toString().padStart(2, '0');
    return `${sign}${hourStr}:${minuteStr}`;
  };

  return (
    <Modal size="lg" isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-4xl mx-auto relative">
        {actionLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center">
            <Loading message={actionLoading ? 'Processing...' : 'Loading timezones...'} />
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? 'Update Event' : 'Schedule Event'}
            </h2>
            <p className="text-gray-600 mt-1">Set up an event with the candidate</p>
          </div>
        </div>

        {/* Candidate Info */}
        <div
          className={`rounded-lg p-4 mb-6 relative flex items-center justify-between ${isEdit && interview && interview.status === 'cancelled' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">{formatCandidateName()}</h3>
              <p className="text-sm text-gray-600">{candidate.email}</p>
              <p className="text-sm text-gray-600">{jobTitle}</p>
              {isEdit && interview && (
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                    interview.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : interview.status === 'interview_scheduled'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {interview.status?.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Summary */}
          <div className="flex flex-col w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Summary
              <span className="text-xs text-gray-500">
                <br />
                <b>Note:</b> This will be used as the subject of the email notification sent to the
                candidate.
              </span>
            </label>
            <input
              value={formData.eventSummary}
              onChange={(e) => handleInputChange('eventSummary', e.target.value)}
              placeholder="Enter event summary"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <DatePicker
              label="Event Date"
              value={formData.date}
              onChange={(date) => handleInputChange('date', date)}
              minDate={getMinDate()}
              error={errors.date}
            />

            {/* Time */}
            <TimePicker
              label="Event Time"
              value={formData.time}
              onChange={(time) => handleInputChange('time', time)}
              error={errors.time}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <DurationPicker
              label="Duration"
              value={formData.duration}
              onChange={(duration) => handleInputChange('duration', duration)}
              error={errors.duration}
            />

            {/* Timezone */}
            <div className="flex flex-col w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <div className="min-h-[40px]">
                {/* TODO: Add click-outside support in TimezonePicker for better UX */}
                <TimezonePicker
                  label=""
                  value={formData.timezoneId}
                  onChange={(timezoneId) => handleInputChange('timezoneId', timezoneId)}
                  timezones={timezones}
                  error={errors.timezoneId}
                  placeholder="Select timezone"
                  className="h-10 text-sm"
                />
              </div>
              {formData.timezoneId && getSelectedTimezone() && (
                <div className="text-xs flex-col gap-1 text-gray-500 mt-1">
                  <span className="text-gray-500">{getSelectedTimezone()!.displayName}</span>
                  <span className="text-gray-500">
                    {' '}
                    (
                    {formatOffset(
                      getSelectedTimezone()!.offsetHours,
                      getSelectedTimezone()!.offsetMinutes,
                    )}
                    )
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Add any additional notes or instructions for the candidate..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Summary */}
          {formData.date && formData.time && formData.timezoneId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Interview Summary</h4>
              <div className="text-sm text-green-800 space-y-1">
                <p>
                  <CalendarIcon className="w-4 h-4 inline mr-2" />
                  {new Date(formData.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p>
                  <ClockIcon className="w-4 h-4 inline mr-2" />
                  {formData.time} ({formData.duration} minutes)
                </p>
                {getSelectedTimezone() && (
                  <p>
                    Timezone: {getSelectedTimezone()!.displayName} (
                    {formatOffset(
                      getSelectedTimezone()!.offsetHours,
                      getSelectedTimezone()!.offsetMinutes,
                    )}
                    )
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="submit" size="sm" isLoading={isScheduling} disabled={isScheduling}>
              {isEdit ? 'Update Event' : 'Schedule Event'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default InterviewSchedulingModal;
