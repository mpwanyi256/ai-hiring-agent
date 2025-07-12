'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectInterviewCompany } from '@/store/interview/interviewSelectors';
import { useEffect } from 'react';
import { fetchCompanyBySlug } from '@/store/company/companyThunks';

export default function CompanyTopNavigation() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const company = useAppSelector(selectInterviewCompany);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCompanyBySlug(companySlug));
  }, [companySlug, dispatch]);

  const handleBackClick = () => {
    router.push(`/jobs/${companySlug}`);
  };

  const isOnCompanyJobsPage = pathname === `/jobs/${companySlug}`;

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6">
        {/* Left Section - Back Button or Home Link */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {isOnCompanyJobsPage ? (
            <Link
              href="/"
              className="flex items-center space-x-1.5 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Home</span>
            </Link>
          ) : (
            <button
              onClick={handleBackClick}
              className="flex items-center space-x-1.5 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Back to Jobs</span>
            </button>
          )}
        </div>

        {/* Center Section - Company Logo */}
        <div className="flex items-center justify-center flex-1 px-2 sm:px-4">
          {company?.logo_url ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Image
                src={company.logo_url}
                alt={company.name || 'Company Logo'}
                width={32}
                height={32}
                className="w-8 h-8 sm:w-10 sm:h-10 object-cover bg-white rounded-lg sm:rounded-lg border border-gray-200"
              />
              <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none">
                {company.name}
              </span>
            </div>
          ) : company?.name ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg">
                <span className="text-white font-bold text-sm sm:text-lg">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none">
                {company.name}
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Right Section - Empty for balance */}
        <div className="w-8 sm:w-12 lg:w-32" />
      </div>
    </header>
  );
}
