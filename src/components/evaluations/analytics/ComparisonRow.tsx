import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface ComparisonRowProps {
  label: string;
  value: number;
  baseline: number;
  unit?: string;
}

export function ComparisonRow({ label, value, baseline, unit = '%' }: ComparisonRowProps) {
  const isUp = value > baseline;
  const delta = value - baseline;
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center">
        {isUp ? (
          <ArrowTrendingUpIcon className="w-4 md:w-5 h-4 md:h-5 text-green-500 mr-2" />
        ) : (
          <ArrowTrendingDownIcon className="w-4 md:w-5 h-4 md:h-5 text-red-500 mr-2" />
        )}
        <span className="text-xs md:text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="text-xs md:text-sm">
        <span className={`font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {isUp ? '+' : ''}
          {unit === '%' ? delta.toFixed(1) : Math.round(delta)}
          {unit}
        </span>
        <span className="text-gray-500 ml-1">
          vs {unit === '%' ? baseline.toFixed(1) : Math.round(baseline)}
          {unit} average
        </span>
      </div>
    </div>
  );
}
