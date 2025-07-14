import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="h-[calc(100vh-100px)] inset-0 z-50 bg-primary/90 flex items-center justify-center">
      <div className="flex flex-col gap-4 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        <span className="text-white">{message}</span>
      </div>
    </div>
  );
};
