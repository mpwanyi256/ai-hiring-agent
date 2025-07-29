import React from 'react';
import { Button } from './button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DashboardErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function DashboardError({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className = '',
}: DashboardErrorProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}

export default DashboardError;
