'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TopNavigation from '@/components/navigation/TopNavigation';
import JobSidebar from './JobSidebar';
import JobOverviewTab from './JobOverviewTab';
import JobApplicationTab from './JobApplicationTab';
import { useAppDispatch } from '@/store';
import { setInterview } from '@/store/interview/interviewSlice';

export default function PublicJobPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'application'>('overview');
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetch(`/api/jobs/interview/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch job');
        dispatch(setInterview(data.data));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, dispatch]);

  return (
    <div className="min-h-screen w-full bg-[#f7f7f8] flex flex-col">
      {/* Top Navigation at the very top */}
      <TopNavigation showAuthButtons={false} />
      <div className="flex-1 w-full max-w-6xl flex flex-col items-center mx-auto mb-10 mt-8 px-2">
        {loading && <div className="text-gray-500 text-lg py-20">Loading job details...</div>}
        {error && <div className="text-red-600 text-lg py-20">{error}</div>}
        {!loading && !error && (
          <div className="w-full flex flex-col lg:flex-row gap-16 items-start justify-start">
            {/* Left: Job Info Sidebar */}
            <aside className="w-full lg:w-1/3 flex-shrink-0 lg:border-r lg:border-gray-200 lg:pr-10 mb-8 lg:mb-0">
              <JobSidebar />
            </aside>
            {/* Right: Tabbed Content */}
            <main className="w-full lg:w-2/3">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('application')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'application'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Application
                </button>
              </div>
              {/* Tab Content */}
              <div className="min-h-[600px]">
                {activeTab === 'overview' ? <JobOverviewTab /> : <JobApplicationTab />}
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
