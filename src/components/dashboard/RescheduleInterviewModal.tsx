import React, { useState, useEffect, useCallback } from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  cancelInterview,
  checkInterviewConflicts,
  rescheduleInterview,
} from '@/store/interview/interviewThunks';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import InterviewCard from './InterviewCard';
import DatePicker from '../interviews/DatePicker';
import TimePicker from '../interviews/TimePicker';
import DurationPicker from '../interviews/DurationPicker';
import TimezonePicker from '../interviews/TimezonePicker';
import { apiSuccess, apiError } from '@/lib/notification';
import { Loading } from '@/components/ui/Loading';
import { selectInterviewConflicts } from '@/store/interview/interviewSelectors';
import { selectCompanyTimezones } from '@/store/company/companySelectors';

interface RescheduleInterviewModalProps {
  interview: {
    interview_id: string;
    candidate_id: string;
    job_id: string;
    interview_date: string;
    interview_time: string;
    timezone?: string;
    notes?: string;
    candidate_first_name: string;
    candidate_last_name: string;
    job_title: string;
    meet_link?: string;
    interview_status?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RescheduleInterviewModal: React.FC<RescheduleInterviewModalProps> = ({
  interview,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();

  const timezones = useAppSelector(selectCompanyTimezones);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    timezoneId: '',
    duration: 30,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const conflicts = useAppSelector(selectInterviewConflicts);
  const [googleTokenError, setGoogleTokenError] = useState(false);

  const getSelectedTimezone = useCallback(() => {
    return timezones.find((tz) => tz.id === formData.timezoneId);
  }, [formData.timezoneId, timezones]);

  useEffect(() => {
    if (interview && isOpen) {
      // Pre-fill with current interview data
      setFormData({
        date: interview.interview_date || '',
        time: interview.interview_time || '',
        timezoneId: interview.timezone || timezones.find((tz) => tz.name === 'UTC')?.id || '',
        duration: 30, // Default duration since it's not in the interview prop
        notes: interview.notes || '',
      });
    }
  }, [interview, isOpen, timezones]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const checkForConflicts = useCallback(async () => {
    if (!formData.date || !formData.time) return;

    try {
      const timezone = getSelectedTimezone();

      if (!timezone) {
        apiError('Please select a timezone');
        return;
      }

      const payload = {
        candidateId: interview.candidate_id,
        jobId: interview.job_id,
        date: formData.date,
        time: formData.time,
        timezone: timezone.name,
        excludeInterviewId: interview.interview_id,
      };

      await dispatch(checkInterviewConflicts(payload)).unwrap();
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  }, [
    formData.date,
    formData.time,
    getSelectedTimezone,
    interview.candidate_id,
    interview.job_id,
    interview.interview_id,
    dispatch,
  ]);

  useEffect(() => {
    if (formData.date && formData.time) {
      const timeoutId = setTimeout(checkForConflicts, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [checkForConflicts, formData.date, formData.time]);

  const handleSubmit = async () => {
    if (!formData.date || !formData.time) {
      apiError('Please fill in all required fields');
      return;
    }

    if (conflicts.length > 0) {
      apiError('There are conflicting interviews. Please choose a different time.');
      return;
    }

    setLoading(true);
    setGoogleTokenError(false);

    try {
      const selectedTz = getSelectedTimezone();
      await dispatch(
        rescheduleInterview({
          interviewId: interview.interview_id,
          date: formData.date,
          time: formData.time,
          timezoneId: formData.timezoneId,
          timezoneName: selectedTz?.displayName || selectedTz?.name || '',
          notes: formData.notes,
        }),
      ).unwrap();
      apiSuccess('Interview rescheduled successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message?.includes('Google Calendar') || error.message?.includes('token'))
      ) {
        setGoogleTokenError(true);
        apiError('Google Calendar connection issue. Please reconnect your Google account.');
      } else {
        apiError(error instanceof Error ? error.message : 'Failed to reschedule interview');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInterview = async () => {
    setLoading(true);
    try {
      await dispatch(cancelInterview({ interviewId: interview.interview_id })).unwrap();
      apiSuccess('Interview cancelled successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      apiError('Failed to cancel interview');
      console.error('Failed to cancel interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnectGoogle = () => {
    // TODO: Implement Google reconnection flow
    window.open('/api/auth/google/connect', '_blank');
    setGoogleTokenError(false);
  };

  const formatOffset = (hours: number, minutes: number) => {
    const sign = hours >= 0 ? '+' : '';
    const hourStr = Math.abs(hours).toString().padStart(2, '0');
    const minuteStr = minutes.toString().padStart(2, '0');
    return `${sign}${hourStr}:${minuteStr}`;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Create a mock UpcomingInterview object for InterviewCard
  const mockUpcomingInterview = {
    interview_id: interview.interview_id,
    interview_date: interview.interview_date,
    interview_time: interview.interview_time,
    interview_status: interview.interview_status || 'scheduled',
    candidate_first_name: interview.candidate_first_name,
    candidate_last_name: interview.candidate_last_name,
    candidate_email: '', // Not available in the interview prop
    job_title: interview.job_title,
    meet_link: interview.meet_link,
    job_id: interview.job_id,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reschedule Interview" size="lg">
      <div className="w-full max-w-4xl mx-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center">
            <Loading message={loading ? 'Processing...' : 'Loading timezones...'} />
          </div>
        )}

        {/* Current Interview Display */}
        <div className="mb-6">
          <InterviewCard interview={mockUpcomingInterview} />
        </div>

        {/* Google Token Error */}
        {googleTokenError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 font-medium mb-2">Google Calendar Connection Issue</div>
            <div className="text-red-600 text-sm mb-3">
              Your Google Calendar connection has expired. Please reconnect to continue.
            </div>
            <Button variant="default" size="sm" onClick={handleReconnectGoogle}>
              Reconnect Google Calendar
            </Button>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <DatePicker
              label="Interview Date"
              value={formData.date}
              onChange={(date) => handleInputChange('date', date)}
              minDate={getMinDate()}
            />

            {/* Time */}
            <TimePicker
              label="Interview Time"
              value={formData.time}
              onChange={(time) => handleInputChange('time', time)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <DurationPicker
              label="Duration"
              value={formData.duration}
              onChange={(duration) => handleInputChange('duration', duration)}
            />

            {/* Timezone */}
            <div className="flex flex-col w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <div className="min-h-[40px]">
                <TimezonePicker
                  label=""
                  value={formData.timezoneId}
                  onChange={(timezoneId) => handleInputChange('timezoneId', timezoneId)}
                  timezones={timezones}
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
              <h4 className="font-medium text-green-900 mb-2">New Interview Summary</h4>
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

          {/* Conflict Warning */}
          {conflicts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-yellow-800 font-medium mb-2">
                ⚠️ Scheduling Conflict Detected
              </div>
              <div className="text-yellow-700 text-sm">
                The following interviews conflict with this time:
              </div>
              <ul className="mt-2 text-sm text-yellow-700">
                {conflicts.map((conflict, index) => (
                  <li key={index} className="ml-4">
                    • {conflict.candidate_name} - {conflict.job_title} on {conflict.date} at{' '}
                    {conflict.time}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleCancelInterview}
              disabled={loading}
            >
              Cancel Interview
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={handleSubmit}
                disabled={loading || conflicts.length > 0 || googleTokenError}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Rescheduling...
                  </>
                ) : (
                  'Reschedule Interview'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RescheduleInterviewModal;
