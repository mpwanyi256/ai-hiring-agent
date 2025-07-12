'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CompanyTopNavigation from '@/components/navigation/CompanyTopNavigation';
import JobSidebar from './JobSidebar';
import JobOverviewTab from './JobOverviewTab';
import JobApplicationTab from './JobApplicationTab';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchInterview } from '@/store/interview/interviewThunks';
import { selectIsLoading } from '@/store/interview/interviewSelectors';
import { setInterview } from '@/store/interview/interviewSlice';

export default function PublicJobPage() {
  const { token } = useParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'application'>('overview');
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsLoading);

  useEffect(() => {
    if (!token) return;
    setError(null);

    Promise.all([dispatch(fetchInterview(token))]);

    return () => {
      dispatch(setInterview(null));
    };
  }, [token, dispatch]);

  return (
    <div className="min-h-screen w-full bg-[#f7f7f8] flex flex-col">
      {/* Company Top Navigation */}
      <CompanyTopNavigation />
      <div className="flex-1 w-full max-w-6xl flex flex-col items-center mx-auto mb-10 mt-8 px-2">
        {isLoading && <div className="text-gray-500 text-lg py-20">Loading job details...</div>}
        {error && <div className="text-red-600 text-lg py-20">{error}</div>}
        {!isLoading && !error && (
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
