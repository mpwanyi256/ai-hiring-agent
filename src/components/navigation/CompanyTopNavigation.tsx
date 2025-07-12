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
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section - Back Button or Home Link */}
        <div className="flex items-center space-x-4">
          {isOnCompanyJobsPage ? (
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <HomeIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Home</span>
            </Link>
          ) : (
            <button
              onClick={handleBackClick}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Jobs</span>
            </button>
          )}
        </div>

        {/* Center Section - Company Logo */}
        <div className="flex items-center justify-center flex-1">
          {company?.logo_url ? (
            <div className="flex items-center space-x-3">
              <Image
                src={company.logo_url}
                alt={company.name || 'Company Logo'}
                width={40}
                height={40}
                className=" object-cover bg-white"
              />
              <span className="text-lg font-semibold text-gray-900">{company.name}</span>
            </div>
          ) : company?.name ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg">
                <span className="text-white font-bold text-lg">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{company.name}</span>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Right Section - Empty for balance */}
        <div className="w-32" />
      </div>
    </header>
  );
}
