import { Loader2 } from 'lucide-react';
import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="h-[calc(100vh-100px)] inset-0 z-50 flex items-center justify-center">
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </div>
  );
};
