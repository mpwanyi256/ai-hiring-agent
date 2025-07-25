import React, { useRef, useState } from 'react';
import { Upload, X, File, Image } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onClose?: () => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onClose,
  accept = 'image/*,.pdf,.doc,.docx,.txt,.csv',
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileValidation(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileValidation(files[0]);
    }
  };

  const handleFileValidation = (file: File) => {
    setError(null);

    // Check file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    // Check file type (basic validation)
    const allowedTypes = accept.split(',').map((type) => type.trim());
    const isValidType = allowedTypes.some((type) => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      } else if (type.includes('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      } else {
        return file.type === type;
      }
    });

    if (!isValidType) {
      setError('File type not supported');
      return;
    }

    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-4 w-4" />;
    }

    return <File className="h-4 w-4" />;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {/* Upload area */}
      <div
        className={`
          w-64 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all
          ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="text-center">
          <Upload className={`h-8 w-8 mx-auto mb-2 ${error ? 'text-red-400' : 'text-gray-400'}`} />

          {error ? (
            <div>
              <p className="text-sm font-medium text-red-600 mb-1">Upload Error</p>
              <p className="text-xs text-red-500">{error}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {isDragging ? 'Drop file here' : 'Upload file'}
              </p>
              <p className="text-xs text-gray-500 mb-2">Drag & drop or click to browse</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Max size: {formatFileSize(maxSize)}</p>
                <p>Supported: Images, PDFs, Documents</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File type hints */}
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-1">
            <Image className="h-3 w-3" />
            <span>Images</span>
          </div>
          <div className="flex items-center space-x-1">
            <File className="h-3 w-3" />
            <span>Documents</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
