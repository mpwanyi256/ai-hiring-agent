'use client';

import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface InsightCardProps {
  title: string;
  subtitle?: string;
  data?: DataPoint[];
  type?: 'list' | 'chart' | 'simple';
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

export default function InsightCard({
  title,
  subtitle,
  data = [],
  type = 'simple',
  icon: Icon,
  action,
  children
}: InsightCardProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs text-primary hover:text-primary-light font-medium"
          >
            {action.label}
          </button>
        )}
      </div>

      {children ? (
        children
      ) : type === 'list' && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || '#4F46E5' }}
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{item.value}</div>
                {total > 0 && (
                  <div className="text-xs text-gray-500">
                    {Math.round((item.value / total) * 100)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : type === 'chart' && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{item.label}</span>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ 
                    width: total > 0 ? `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` : '0%',
                    backgroundColor: item.color || '#4F46E5'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
} 