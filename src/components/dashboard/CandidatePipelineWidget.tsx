import React from 'react';
import { useAppSelector } from '@/store';
import {
  selectCandidatePipeline,
  selectPipelineLoading,
  selectPipelineError,
} from '@/store/dashboard/dashboardSelectors';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface CandidatePipelineWidgetProps {
  className?: string;
}

export default function CandidatePipelineWidget({ className = '' }: CandidatePipelineWidgetProps) {
  const pipeline = useAppSelector(selectCandidatePipeline);
  const isLoading = useAppSelector(selectPipelineLoading);
  const error = useAppSelector(selectPipelineError);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
          <p>Failed to load pipeline data</p>
        </div>
      </div>
    );
  }

  const getPipelineItem = (status: string) => {
    return pipeline.find((item) => item.status === status)?.count || 0;
  };

  const pipelineData = [
    {
      stage: 'Applied',
      count: getPipelineItem('applied'),
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      stage: 'In Progress',
      count: getPipelineItem('in_progress'),
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      stage: 'Completed',
      count: getPipelineItem('completed'),
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Pipeline</h3>
      <div className="space-y-4">
        {pipelineData.map((item) => (
          <div key={item.stage} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">{item.stage}</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
