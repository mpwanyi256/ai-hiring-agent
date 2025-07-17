import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchUpcomingInterviews } from '@/store/dashboard/dashboardThunks';
import {
  selectUpcomingInterviews,
  selectDashboardLoading,
  selectDashboardError,
  selectTotalUpcomingInterviews,
} from '@/store/dashboard/dashboardSelectors';
import Modal from '@/components/ui/Modal';
import InterviewCard from './InterviewCard';
import InterviewDetailsModal from './InterviewDetailsModal';
import { UpcomingInterview } from '@/store/dashboard/dashboardSlice';

interface UpcomingInterviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 10;

const UpcomingInterviewsModal: React.FC<UpcomingInterviewsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const interviews = useAppSelector(selectUpcomingInterviews);
  const loading = useAppSelector(selectDashboardLoading);
  const error = useAppSelector(selectDashboardError);
  const total = useAppSelector(selectTotalUpcomingInterviews);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const [selectedInterview, setSelectedInterview] = useState<UpcomingInterview | null>(null);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchUpcomingInterviews({ limit: PAGE_SIZE, page }));
    }
  }, [dispatch, isOpen, page]);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="All Upcoming Interviews" size="xl">
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : interviews.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No upcoming interviews found.</div>
      ) : (
        <div>
          <ul className="space-y-4 mb-6">
            {interviews.map((iv) => (
              <li
                key={iv.interview_id}
                className="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer hover:bg-primary/10"
                onClick={() => setSelectedInterview(iv)}
              >
                <InterviewCard interview={iv} />
                <a
                  href={`/dashboard/jobs/${iv.job_id}`}
                  className="text-primary text-xs mt-2 md:mt-0 md:ml-4 hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Job Details
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <button
              className="px-3 py-1 rounded border text-xs disabled:opacity-50"
              onClick={handlePrev}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-xs text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded border text-xs disabled:opacity-50"
              onClick={handleNext}
              disabled={page === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
          {selectedInterview && (
            <InterviewDetailsModal
              interview={selectedInterview}
              isOpen={!!selectedInterview}
              onClose={() => setSelectedInterview(null)}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default UpcomingInterviewsModal;
