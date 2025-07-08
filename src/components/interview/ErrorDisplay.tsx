'use client';

interface ErrorInfo {
  type: 'database' | 'system' | 'validation';
  title: string;
  message: string;
  canProceed: boolean;
  icon: string;
  color: 'yellow' | 'red';
}

interface ErrorDisplayProps {
  error: string | null;
  validationError: string | null;
  evaluation?: Record<string, unknown> | null;
  onDismiss?: () => void;
}

export default function ErrorDisplay({
  error,
  validationError,
  evaluation,
  onDismiss,
}: ErrorDisplayProps) {
  // Helper function to determine error type and message
  const getErrorInfo = (): ErrorInfo | null => {
    const errorMessage = error || validationError;
    if (!errorMessage) return null;

    // Check if this is a system error vs evaluation failure
    const isSystemError =
      errorMessage.includes('database') ||
      errorMessage.includes('System error') ||
      errorMessage.includes('Failed to parse') ||
      errorMessage.includes('configuration error');

    const isDatabaseError =
      errorMessage.includes('database') || errorMessage.includes('Database error');

    if (isDatabaseError) {
      return {
        type: 'database',
        title: 'Technical Issue Encountered',
        message:
          'We successfully analyzed your resume, but encountered a technical issue while saving the results. Your evaluation is still available below.',
        canProceed: evaluation !== null, // Can proceed if we have evaluation data
        icon: '⚠️',
        color: 'yellow',
      };
    } else if (isSystemError) {
      return {
        type: 'system',
        title: 'System Error',
        message: errorMessage,
        canProceed: false,
        icon: '❌',
        color: 'red',
      };
    } else {
      return {
        type: 'validation',
        title: 'File Processing Error',
        message: errorMessage,
        canProceed: false,
        icon: '❌',
        color: 'red',
      };
    }
  };

  const errorInfo = getErrorInfo();
  if (!errorInfo) return null;

  return (
    <div
      className={`border rounded-lg p-4 mb-6 ${
        errorInfo.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3 mt-1">{errorInfo.icon}</span>
        <div className="flex-1">
          <h4
            className={`font-semibold mb-2 ${
              errorInfo.color === 'yellow' ? 'text-yellow-800' : 'text-red-800'
            }`}
          >
            {errorInfo.title}
          </h4>
          <p
            className={`text-sm ${
              errorInfo.color === 'yellow' ? 'text-yellow-700' : 'text-red-700'
            }`}
          >
            {errorInfo.message}
          </p>

          {/* Database error with evaluation available */}
          {errorInfo.type === 'database' && evaluation && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm font-medium">
                ✅ Good news: Your resume evaluation completed successfully!
              </p>
              <p className="text-blue-700 text-sm mt-1">
                You can review your results and continue to the interview below.
              </p>
            </div>
          )}

          {/* Retry button for system errors */}
          {(errorInfo.type === 'system' || errorInfo.type === 'validation') && onDismiss && (
            <button
              onClick={onDismiss}
              className="mt-3 text-sm bg-white border border-gray-300 rounded px-3 py-1 hover:bg-gray-50 transition-colors"
            >
              Dismiss Error
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
