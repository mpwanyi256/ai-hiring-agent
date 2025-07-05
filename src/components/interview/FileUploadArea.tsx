'use client';

import { useState, useRef } from 'react';
import { CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { validateFile } from '@/lib/utils';

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function FileUploadArea({
  onFileSelect,
  selectedFile,
  isLoading = false,
  disabled = false
}: FileUploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      // You might want to handle validation errors differently
      console.error('File validation failed:', validation.error);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📋';
      default:
        return '📎';
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive 
          ? 'border-primary bg-primary/5' 
          : selectedFile 
          ? 'border-green-400 bg-green-50' 
          : 'border-gray-300 bg-white hover:border-gray-400'
      } ${isLoading || disabled ? 'pointer-events-none opacity-50' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDrag}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading || disabled}
      />
      
      {selectedFile ? (
        <div className="space-y-2">
          <div className="text-4xl">{getFileIcon(selectedFile.name)}</div>
          <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto" />
          <p className="text-lg font-semibold text-green-800">File Selected</p>
          <p className="text-green-700">{selectedFile.name}</p>
          <p className="text-sm text-green-600">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="text-lg font-semibold text-text">
            Drag and drop your resume here
          </p>
          <p className="text-muted-text">or click to browse files</p>
          <p className="text-sm text-muted-text">
            Supports PDF, DOC, DOCX, and TXT files (up to 10MB)
          </p>
        </div>
      )}
    </div>
  );
} 