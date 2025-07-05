'use client';

import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface UploadProgressProps {
  isUploading: boolean;
  uploadProgress: number;
}

export default function UploadProgress({
  isUploading,
  uploadProgress
}: UploadProgressProps) {
  if (!isUploading) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center mb-2">
        <CloudArrowUpIcon className="w-5 h-5 text-blue-600 mr-2" />
        <p className="text-blue-800 font-medium">Evaluating your resume...</p>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(uploadProgress, 90)}%` }}
        ></div>
      </div>
      <p className="text-blue-600 text-sm mt-2">
        Parsing document and analyzing content...
      </p>
    </div>
  );
} 