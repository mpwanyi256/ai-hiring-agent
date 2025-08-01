import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store';
import { cancelInterview } from '@/store/interviews/interviewsThunks';
import RescheduleInterviewModal from './RescheduleInterviewModal';

interface InterviewDetailsModalProps {
  interview: any;
  isOpen: boolean;
  onClose: () => void;
}

const InterviewDetailsModal: React.FC<InterviewDetailsModalProps> = ({
  interview,
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showGoogleReconnectPrompt, setShowGoogleReconnectPrompt] = useState(false);

  if (!interview) return null;

  const handleCopyLink = () => {
    if (interview.meet_link) {
      navigator.clipboard.writeText(interview.meet_link);
    }
  };

  // Placeholder handlers for reschedule/cancel
  const handleReschedule = () => {
    setIsRescheduleModalOpen(true);
  };
  const handleCancel = () => {
    setShowCancelConfirmation(true);
  };

  const handleConfirmCancel = async () => {
    if (!interview?.interview_id) return;

    setIsCancelling(true);
    try {
      const result = await dispatch(
        cancelInterview({ interviewId: interview.interview_id }),
      ).unwrap();

      // Check if Google integration is disconnected
      if (result?.googleIntegrationStatus && !result.googleIntegrationStatus.connected) {
        setShowCancelConfirmation(false);
        setShowGoogleReconnectPrompt(true);
      } else {
        setShowCancelConfirmation(false);
        onClose(); // Close the modal after successful cancellation
      }
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      setShowCancelConfirmation(false);
      // You might want to show an error toast here
    } finally {
      setIsCancelling(false);
    }
  };

  const handleGoogleReconnect = () => {
    // Open Google auth in a popup window
    const popup = window.open(
      '/api/integrations/google/connect',
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes',
    );

    if (popup) {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setTimeout(() => {
            setShowGoogleReconnectPrompt(false);
            onClose(); // Close the modal after reconnection
          }, 1000);
        }
      }, 1000);

      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          clearInterval(checkClosed);
        }
      }, 300000);
    } else {
      window.location.href = '/api/integrations/google/connect';
    }
  };

  const handleRescheduleSuccess = () => {
    // Refresh the interviews list or close the details modal
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Interview Details" size="lg">
        <div className="space-y-4">
          <div>
            <div className="font-semibold text-lg mb-2">
              {interview.candidate_first_name} {interview.candidate_last_name}
            </div>
            <div className="text-sm text-gray-500">{interview.candidate_email}</div>
          </div>
          <div>
            <div className="font-medium">Job:</div>
            <div className="text-gray-700">{interview.job_title}</div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <div className="font-medium">Date:</div>
              <div>{interview.interview_date}</div>
            </div>
            <div>
              <div className="font-medium">Time:</div>
              <div>{interview.interview_time}</div>
            </div>
            {/* Add duration, timezone, notes if available */}
          </div>
          {interview.meet_link && (
            <div>
              <div className="font-medium">Google Meet Link:</div>
              <div className="flex items-center gap-2">
                <a
                  href={interview.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline break-all"
                >
                  {interview.meet_link}
                </a>
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  Copy Link
                </Button>
              </div>
            </div>
          )}
          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <Button variant="default" onClick={handleReschedule}>
              Reschedule
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel Interview
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <RescheduleInterviewModal
        interview={interview}
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        onSuccess={handleRescheduleSuccess}
      />

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={showCancelConfirmation} onClose={() => setShowCancelConfirmation(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Interview</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to cancel this interview with{' '}
            <span className="font-medium">
              {interview.candidate_first_name} {interview.candidate_last_name}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirmation(false)}
              disabled={isCancelling}
            >
              Keep Interview
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel} disabled={isCancelling}>
              {isCancelling ? 'Cancelling...' : 'Cancel Interview'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Google Reconnection Prompt Modal */}
      <Modal isOpen={showGoogleReconnectPrompt} onClose={() => setShowGoogleReconnectPrompt(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Interview Cancelled Successfully
          </h3>
          <p className="text-gray-600 mb-4">
            The interview has been cancelled successfully. However, your Google Calendar integration
            is disconnected, so the calendar event could not be removed automatically.
          </p>
          <p className="text-gray-600 mb-6">
            Would you like to reconnect your Google Calendar to manage future calendar events?
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowGoogleReconnectPrompt(false);
                onClose();
              }}
            >
              Skip for Now
            </Button>
            <Button variant="default" onClick={handleGoogleReconnect}>
              Reconnect Google Calendar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default InterviewDetailsModal;
