import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
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
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);

  if (!interview) return null;

  const handleCopyLink = () => {
    if (interview.meet_link) {
      navigator.clipboard.writeText(interview.meet_link);
    }
  };

  // Placeholder handlers for reschedule/cancel
  const handleReschedule = () => {
    setRescheduleModalOpen(true);
  };
  const handleCancel = () => {
    // TODO: Trigger cancel interview logic
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
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        onSuccess={handleRescheduleSuccess}
      />
    </>
  );
};

export default InterviewDetailsModal;
