import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  progressPercent?: number;
  valueClassName?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  progressPercent,
  valueClassName,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs md:text-sm font-medium text-gray-500">{title}</h3>
        {icon}
      </div>
      <div className="flex items-baseline">
        <span className={`text-2xl md:text-xl font-bold ${valueClassName || 'text-gray-900'}`}>
          {value}
        </span>
      </div>
      {typeof progressPercent === 'number' && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
            <div
              className="bg-primary h-1.5 md:h-2 rounded-full transition-all"
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />
          </div>
        </div>
      )}
      {subtitle && <p className="text-[10px] md:text-xs text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}
