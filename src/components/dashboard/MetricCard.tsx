'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  progress?: {
    current: number;
    max: number;
    label?: string;
  };
  onClick?: () => void;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  trend,
  progress,
  onClick
}: MetricCardProps) {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:border-gray-200' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgColor}`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {title}
              </p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>

          {trend && (
            <div className="flex items-center mt-2">
              <div className={`flex items-center text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="mr-1">
                  {trend.isPositive ? '↗' : '↘'}
                </span>
                {Math.abs(trend.value)}%
              </div>
              <span className="text-xs text-gray-500 ml-1">{trend.label}</span>
            </div>
          )}

          {progress && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{progress.label || 'Usage'}</span>
                <span>{progress.current}/{progress.max === -1 ? '∞' : progress.max}</span>
              </div>
              {progress.max !== -1 && (
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min((progress.current / progress.max) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 