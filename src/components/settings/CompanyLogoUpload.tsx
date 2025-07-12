'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { apiError } from '@/lib/notification';

interface CompanyLogoUploadProps {
  logoUrl?: string | null;
  disabled?: boolean;
  onFileSelected?: (file: File) => void;
  isUploading?: boolean;
}

export default function CompanyLogoUpload({
  logoUrl,
  disabled = false,
  onFileSelected,
  isUploading = false,
}: CompanyLogoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(logoUrl || null);

  useEffect(() => {
    setPreviewUrl(logoUrl || null);
  }, [logoUrl]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024) {
        apiError('File size must be less than 5MB');
        return;
      }
      setPreviewUrl(URL.createObjectURL(file));
      if (onFileSelected) onFileSelected(file);
    },
    [onFileSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled,
  });

  return (
    <div className="flex flex-col gap-2 items-center w-full space-y-2">
      <h2 className="block font-medium text-gray-700 mb-2">Company Branding</h2>
      <div
        {...getRootProps()}
        className={`relative w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center bg-gray-50 cursor-pointer transition-colors overflow-hidden
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-disabled={disabled}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex items-center justify-center w-full h-full">
            <svg
              className="animate-spin h-8 w-8 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : previewUrl ? (
          <Image
            src={previewUrl}
            alt="Company logo"
            width={128}
            height={128}
            className="object-cover w-full h-full rounded-full"
          />
        ) : (
          <PhotoIcon className="w-16 h-16 text-gray-300" />
        )}
      </div>
    </div>
  );
}
