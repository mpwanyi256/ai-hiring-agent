'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/store';
import { scheduleInterview, updateInterview } from '@/store/interviews/interviewsThunks';
import { selectIsInterviewScheduling } from '@/store/interviews/interviewsSelectors';
import { selectCompany } from '@/store/company/companySelectors';
import { selectUser } from '@/store/auth/authSelectors';
import { CandidateWithEvaluation, InterviewDetails } from '@/types/candidates';
import { CreateInterviewData, Timezone } from '@/types/interviews';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import DurationPicker from './DurationPicker';
import TimezonePicker from './TimezonePicker';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { apiSuccess } from '@/lib/notification';

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

  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [timezoneLoading, setTimezoneLoading] = useState(false);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateInterviewData>({
    applicationId: candidate.id,
    jobId: jobId,
    date: '',
    time: '09:00',
    timezoneId: '',
    duration: 30,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch timezones on component mount
  useEffect(() => {
    const fetchTimezones = async () => {
      setTimezoneLoading(true);
      try {
        const response = await fetch('/api/timezones');
        const data = await response.json();

        if (data.success) {
          setTimezones(data.timezones);
        } else {
          setTimezoneError(data.error || 'Failed to load timezones');
        }
      } catch (error) {
        setTimezoneError('Failed to load timezones');
        console.error('Error fetching timezones:', error);
      } finally {
        setTimezoneLoading(false);
      }
    };

    fetchTimezones();
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isEdit && interview) {
        setFormData({
          applicationId: candidate.id,
          jobId: jobId,
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
          date: '',
          time: '09:00',
          timezoneId: defaultTimezoneId,
          duration: 30,
          notes: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, candidate.id, jobId, company?.timezoneId, timezones, isEdit, interview]);

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
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? 'Update Interview' : 'Schedule Interview'}
            </h2>
            <p className="text-gray-600 mt-1">Set up an interview with the candidate</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Candidate Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">{formatCandidateName()}</h3>
              <p className="text-sm text-gray-600">{candidate.email}</p>
              <p className="text-sm text-gray-600">{jobTitle}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <DatePicker
              label="Interview Date"
              value={formData.date}
              onChange={(date) => handleInputChange('date', date)}
              minDate={getMinDate()}
              error={errors.date}
            />

            {/* Time */}
            <TimePicker
              label="Interview Time"
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
              {timezoneLoading ? (
                <div className="text-sm text-gray-500">Loading timezones...</div>
              ) : timezoneError ? (
                <div className="text-sm text-red-500">{timezoneError}</div>
              ) : (
                <TimezonePicker
                  label=""
                  value={formData.timezoneId}
                  onChange={(timezoneId) => handleInputChange('timezoneId', timezoneId)}
                  timezones={timezones}
                  error={errors.timezoneId}
                  placeholder="Select timezone"
                />
              )}
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Interview Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isScheduling}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isScheduling} disabled={isScheduling}>
              {isEdit ? 'Update Interview' : 'Schedule Interview'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default InterviewSchedulingModal;
