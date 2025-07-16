import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchUpcomingInterviews } from '@/store/dashboard/dashboardThunks';
import {
  selectUpcomingInterviews,
  selectDashboardLoading,
  selectDashboardError,
} from '@/store/dashboard/dashboardSelectors';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import InterviewCard from './InterviewCard';
import { selectUser } from '@/store/auth/authSelectors';
import Modal from '@/components/ui/Modal';
import UpcomingInterviewsModal from './UpcomingInterviewsModal';

export default function UpcomingInterviewsWidget() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const interviews = useAppSelector(selectUpcomingInterviews);
  const loading = useAppSelector(selectDashboardLoading);
  const error = useAppSelector(selectDashboardError);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchUpcomingInterviews({ limit: 5 }));
    }
  }, [user?.companyId, dispatch]);

  return (
    <div className="bg-white rounded-lg shadow border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalendarDaysIcon className="w-5 h-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h2>
        </div>
        <button
          className="text-xs text-primary hover:underline font-medium"
          onClick={() => setModalOpen(true)}
        >
          View All
        </button>
      </div>
      {loading ? (
        <div className="text-gray-500 py-6 text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-500 py-6 text-center">{error}</div>
      ) : interviews.length === 0 ? (
        <div className="flex flex-col items-center py-8">
          <CalendarDaysIcon className="w-10 h-10 text-gray-300 mb-2" />
          <div className="text-gray-500 text-sm font-medium mb-1">No upcoming interviews</div>
          <div className="text-xs text-gray-400">Scheduled interviews will appear here.</div>
        </div>
      ) : (
        <ul className="space-y-3">
          {interviews.map((iv) => (
            <li key={iv.interview_id}>
              <InterviewCard interview={iv} />
            </li>
          ))}
        </ul>
      )}
      <UpcomingInterviewsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
