'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { selectCompany } from '@/store/company/companySelectors';
import { useAppSelector } from '@/store';

interface CompanyLogoUploadProps {
  currentLogoUrl?: string | null;
  disabled?: boolean;
}

export default function CompanyLogoUpload({ disabled = false }: CompanyLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const company = useAppSelector(selectCompany);
  const [previewUrl, setPreviewUrl] = useState<string | null>(company?.logo_url || null);

  const handleLogoChange = useCallback((file: File) => {
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsUploading(true);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      handleLogoChange(file);

      setIsUploading(false);
    },
    [handleLogoChange],
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

  const handleRemove = () => {
    setPreviewUrl(null);
    setLogoPreview(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
        <p className="text-xs text-gray-500 mb-4">
          Upload your company logo. Recommended size: 200x200px. Max file size: 5MB.
        </p>
      </div>

      <div className="flex items-start space-x-4">
        {/* Logo Preview */}
        {(previewUrl || company?.logo_url) && (
          <div className="relative">
            <div className="w-20 h-20 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
              <Image
                src={previewUrl || company?.logo_url || ''}
                alt="Company logo"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`flex-1 min-h-[120px] border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Drop the logo here...</p>
              ) : (
                <div>
                  <p className="font-medium">
                    {previewUrl || company?.logo_url ? 'Change logo' : 'Upload logo'}
                  </p>
                  <p className="text-xs text-gray-500">Drag and drop, or click to select</p>
                </div>
              )}
            </div>
            {isUploading && <div className="text-xs text-primary">Uploading...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
