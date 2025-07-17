'use client';

import React from 'react';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface CandidatesOverviewProps {
  totalCandidates: number;
  shortlisted: number;
  completed: number;
  averageScore: number;
}

export default function CandidatesOverview({
  totalCandidates,
  shortlisted,
  completed,
  averageScore,
}: CandidatesOverviewProps) {
  const metrics = [
    {
      label: 'Total Applications',
      value: totalCandidates,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Shortlisted',
      value: shortlisted,
      icon: ClockIcon,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Avg Score',
      value: averageScore,
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isScore: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${metric.bgColor}`}
            >
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {metric.isScore ? metric.value : metric.value}
                {metric.isScore && <span className="text-sm font-normal text-gray-500">%</span>}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
