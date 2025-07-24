import React, { useRef, useState } from 'react';
import { Paperclip, Upload, X, File, Image, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/json',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported. Please use images, PDFs, Word docs, or text files.');
      return;
    }

    onFileSelect(file);
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (selectedFile) {
    return (
      <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg p-2 mb-2">
        {getFileIcon(selectedFile.type)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
          <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
        </div>
        <button
          onClick={onFileRemove}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Remove file"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
      />

      <button
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={disabled}
        className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          dragOver ? 'bg-blue-50 text-blue-600' : ''
        }`}
        title="Attach file (max 10MB)"
      >
        {dragOver ? <Upload className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
      </button>
    </>
  );
};

export default FileUpload;
