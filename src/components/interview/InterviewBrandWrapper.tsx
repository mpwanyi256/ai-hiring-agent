import Image from 'next/image';
import React from 'react';

interface InterviewBrandWrapperProps {
  companyName: string;
  companyLogo?: string;
  companySlug?: string;
  jobTitle?: string;
  jobMeta?: React.ReactNode;
  leftContent?: React.ReactNode; // For extra info if needed
  children: React.ReactNode;
}

const InterviewBrandWrapper: React.FC<InterviewBrandWrapperProps> = ({
  companyName,
  companyLogo,
  companySlug,
  jobTitle,
  jobMeta,
  leftContent,
  children,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#f7f7f8] flex flex-col items-center px-2 py-8">
      {/* Company Branding */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-8">
        {companyLogo && (
          <div className="mb-2">
            <Image
              src={companyLogo}
              alt={companyName}
              width={48}
              height={48}
              className="rounded-full object-cover border border-gray-200 bg-white"
            />
          </div>
        )}
        <div className="text-xl font-bold text-gray-900 text-center">{companyName}</div>
        {companySlug && (
          <div className="text-xs text-gray-400 text-center mt-0.5">{companySlug}</div>
        )}
      </div>
      {/* Main Content: Two Columns */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-start justify-center">
        {/* Left: Job Info */}
        <aside className="w-full md:w-1/3 flex-shrink-0 mb-8 md:mb-0">
          {jobTitle && (
            <div className="text-lg font-semibold text-gray-900 mb-2 leading-tight">{jobTitle}</div>
          )}
          {jobMeta && <div className="mb-4 text-sm text-gray-600 space-y-1">{jobMeta}</div>}
          {leftContent}
        </aside>
        {/* Right: Main Card */}
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="p-6 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default InterviewBrandWrapper;
