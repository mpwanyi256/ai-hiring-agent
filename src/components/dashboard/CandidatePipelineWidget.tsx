import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { fetchCandidatePipeline } from '@/store/dashboard/dashboardThunks';
import {
  selectCandidatePipeline,
  selectPipelineLoading,
  selectPipelineError,
} from '@/store/dashboard/dashboardSelectors';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const STATUS_LABELS: Record<string, string> = {
  under_review: 'Under Review',
  interview_scheduled: 'Interview Scheduled',
  shortlisted: 'Shortlisted',
  reference_check: 'Reference Check',
  offer_extended: 'Offer Extended',
  offer_accepted: 'Offer Accepted',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const STATUS_COLORS: Record<string, string> = {
  under_review: 'bg-gray-200',
  interview_scheduled: 'bg-blue-200',
  shortlisted: 'bg-green-400',
  reference_check: 'bg-yellow-300',
  offer_extended: 'bg-blue-400',
  offer_accepted: 'bg-emerald-400',
  hired: 'bg-primary',
  rejected: 'bg-red-300',
  withdrawn: 'bg-gray-400',
};

export default function CandidatePipelineWidget() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const pipeline = useSelector(selectCandidatePipeline);
  const loading = useSelector(selectPipelineLoading);
  const error = useSelector(selectPipelineError);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchCandidatePipeline({ companyId: user.companyId }) as any);
    }
  }, [user?.companyId, dispatch]);

  const total = pipeline.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-lg shadow border p-5">
      <div className="flex items-center mb-4">
        <UserGroupIcon className="w-5 h-5 text-primary mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Candidate Pipeline</h2>
      </div>
      {loading ? (
        <div className="text-gray-500 py-6 text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-500 py-6 text-center">{error}</div>
      ) : pipeline.length === 0 ? (
        <div className="flex flex-col items-center py-8">
          <UserGroupIcon className="w-10 h-10 text-gray-300 mb-2" />
          <div className="text-gray-500 text-sm font-medium mb-1">No candidates yet</div>
          <div className="text-xs text-gray-400">Candidates will appear as they apply.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {pipeline.map((item) => {
            const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.status} className="flex items-center space-x-3">
                <div className="w-32 text-xs text-gray-700 font-medium">
                  {STATUS_LABELS[item.status] || item.status}
                </div>
                <div className="flex-1">
                  <div className="w-full h-3 rounded bg-gray-100">
                    <div
                      className={`h-3 rounded ${STATUS_COLORS[item.status] || 'bg-gray-300'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
                <div className="w-10 text-xs text-gray-600 text-right">{item.count}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
