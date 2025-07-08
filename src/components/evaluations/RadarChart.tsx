'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { RadarMetrics } from '@/types/evaluations';

interface RadarChartProps {
  radarMetrics: RadarMetrics;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RadarChart({ radarMetrics, className = '', size = 'md' }: RadarChartProps) {
  // Calculate dimensions based on size
  const dimensions = {
    sm: { width: 200, height: 200, radius: 70 },
    md: { width: 320, height: 320, radius: 110 },
    lg: { width: 400, height: 400, radius: 150 },
  };
  const { width, height, radius } = dimensions[size];

  const indicator = [
    { name: 'Skills', max: 100 },
    { name: 'Growth Mindset', max: 100 },
    { name: 'Team Work', max: 100 },
    { name: 'Culture', max: 100 },
    { name: 'Communication', max: 100 },
  ];

  const data = [
    radarMetrics.skills,
    radarMetrics.growth_mindset,
    radarMetrics.team_work,
    radarMetrics.culture,
    radarMetrics.communication,
  ];

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value: number[] }) => {
        return params.name + ': ' + params.value.join(', ');
      },
    },
    radar: {
      indicator,
      radius: radius,
      center: ['50%', '55%'],
      splitNumber: 5,
      axisName: {
        color: '#222',
        fontSize: size === 'sm' ? 11 : 14,
        fontWeight: 600,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 3,
        padding: [3, 5],
      },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      splitLine: { lineStyle: { color: '#e5e7eb' } },
      splitArea: { areaStyle: { color: ['#f7fafc', '#fff'] } },
    },
    series: [
      {
        name: 'Competency',
        type: 'radar',
        data: [
          {
            value: data,
            name: 'Score',
            areaStyle: { color: 'rgba(68,182,117,0.3)' },
            lineStyle: { color: '#44B675', width: 3 },
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: { color: '#44B675' },
          },
        ],
      },
    ],
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <ReactECharts
        option={option}
        style={{ height, width }}
        opts={{ renderer: 'svg' }}
        notMerge={true}
        lazyUpdate={true}
      />
      {/* Legend below the chart */}
      <div className="mt-4 grid grid-cols-1 gap-2 text-center max-w-xs">
        {indicator.map((ind, idx) => {
          const value = data[idx];
          const statusText =
            value >= 80
              ? 'Excellent'
              : value >= 65
                ? 'Good'
                : value >= 50
                  ? 'Average'
                  : 'Needs Improvement';
          return (
            <div key={ind.name} className="flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium">{ind.name}:</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-green-700">{value}%</span>
                <span className="text-gray-500">({statusText})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
