import { ClockIcon, SparklesIcon } from 'lucide-react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { triggerAIEvaluation } from '@/store/candidates/candidatesThunks';
import { useAppDispatch } from '@/store';
import { apiError, apiSuccess } from '@/lib/notification';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type NoAIEvaluationsProps = {
  className?: string;
  candidateId: string;
};

export const NoAIEvaluations = ({ className, candidateId }: NoAIEvaluationsProps) => {
  const dispatch = useAppDispatch();
  const [hasFailedEvaluation, setHasFailedEvaluation] = useState(false);
  const [isCheckingFailed, setIsCheckingFailed] = useState(true);

  useEffect(() => {
    const checkFailedEvaluation = async () => {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('function_logs')
          .select('*')
          .eq('function_name', 'ai-candidate-evaluation')
          .eq('candidate_id', candidateId)
          .eq('status', 'failed')
          .order('triggered_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          setHasFailedEvaluation(true);
        }
      } catch (error) {
        console.error('Error checking for failed evaluations:', error);
      } finally {
        setIsCheckingFailed(false);
      }
    };

    checkFailedEvaluation();
  }, [candidateId]);

  const handleTriggerAIEvaluation = async () => {
    try {
      await dispatch(triggerAIEvaluation({ candidateId, force: false })).unwrap();
      apiSuccess('AI evaluation started in background');
    } catch {
      apiError('Failed to start AI evaluation. Please try again later.');
    }
  };

  const handleRetryFailedEvaluation = async () => {
    try {
      await dispatch(triggerAIEvaluation({ candidateId, force: true })).unwrap();
      apiSuccess('Retrying AI evaluation...');
      setHasFailedEvaluation(false); // Reset the failed state
    } catch {
      apiError('Failed to retry AI evaluation. Please try again later.');
    }
  };

  if (isCheckingFailed) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <ClockIcon className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Checking evaluation status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="text-center py-8">
        {hasFailedEvaluation ? (
          <>
            <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Previous Evaluation Failed</h3>
            <p className="text-gray-600 mb-6">
              The previous AI evaluation attempt failed. You can retry the evaluation or generate a
              new one.
            </p>
            <div className="flex justify-center space-x-3">
              <Button onClick={handleRetryFailedEvaluation} className="px-6 py-2" variant="outline">
                <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                Retry Failed Evaluation
              </Button>
              <Button onClick={handleTriggerAIEvaluation} className="px-6 py-2">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Generate New Evaluation
              </Button>
            </div>
          </>
        ) : (
          <>
            <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Evaluation Yet</h3>
            <p className="text-gray-600 mb-6">
              Generate an AI evaluation to see comprehensive candidate insights and scoring.
            </p>
            <Button onClick={handleTriggerAIEvaluation} className="px-6 py-2" disabled={false}>
              {false ? (
                <>
                  <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Generate AI Evaluation
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
