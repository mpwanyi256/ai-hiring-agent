'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CompanyTopNavigation from '@/components/navigation/CompanyTopNavigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCompanyBySlug } from '@/store/company/companyThunks';
import { selectInterviewCompany } from '@/store/interview/interviewSelectors';
import { BriefcaseIcon } from '@heroicons/react/24/outline';

export default function CompanyJobsPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const company = useAppSelector(selectInterviewCompany);

  useEffect(() => {
    if (!companySlug) return;
    setIsLoading(true);
    setError(null);

    dispatch(fetchCompanyBySlug(companySlug))
      .unwrap()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load company');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [companySlug, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#f7f7f8] flex flex-col">
        <CompanyTopNavigation />
        <div className="flex-1 w-full max-w-6xl flex flex-col items-center mx-auto mb-10 mt-8 px-2">
          <div className="text-gray-500 text-lg py-20">Loading company jobs...</div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen w-full bg-[#f7f7f8] flex flex-col">
        <CompanyTopNavigation />
        <div className="flex-1 w-full max-w-6xl flex flex-col items-center mx-auto mb-10 mt-8 px-2">
          <div className="text-red-600 text-lg py-20">{error || 'Company not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f7f7f8] flex flex-col">
      <CompanyTopNavigation />
      <div className="flex-1 w-full max-w-6xl flex flex-col items-center mx-auto mb-10 mt-8 px-2">
        {/* Jobs Section */}
        <div className="w-full">
          <div className="bg-white rounded-lg border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Open Positions</h2>
            </div>

            {/* Placeholder for jobs list */}
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BriefcaseIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No open positions</h3>
              <p className="text-gray-600">
                {company.name} doesn&apos;t have any active job postings at the moment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
