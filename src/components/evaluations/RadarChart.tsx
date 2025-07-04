'use client';

import React from 'react';
import { RadarMetrics } from '@/types/evaluations';
import { radarChartUtils } from '@/lib/utils/evaluationUtils';

interface RadarChartProps {
  radarMetrics: RadarMetrics;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RadarChart({ radarMetrics, className = '', size = 'md' }: RadarChartProps) {
  // Calculate dimensions based on size
  const dimensions = {
    sm: { width: 200, height: 200, radius: 80 },
    md: { width: 300, height: 300, radius: 120 },
    lg: { width: 400, height: 400, radius: 160 }
  };

  const { width, height, radius } = dimensions[size];
  const center = { x: width / 2, y: height / 2 };
  
  // Radar metrics in the order shown in the image
  const metrics = [
    { key: 'skills' as keyof RadarMetrics, label: 'Skills', value: radarMetrics.skills },
    { key: 'growth_mindset' as keyof RadarMetrics, label: 'Growth Mindset', value: radarMetrics.growth_mindset },
    { key: 'team_work' as keyof RadarMetrics, label: 'Team Work', value: radarMetrics.team_work },
    { key: 'culture' as keyof RadarMetrics, label: 'Culture', value: radarMetrics.culture },
    { key: 'communication' as keyof RadarMetrics, label: 'Communication', value: radarMetrics.communication }
  ];

  // Calculate points for pentagon shape
  const getPoint = (index: number, value: number) => {
    const angle = (index * 2 * Math.PI) / metrics.length - Math.PI / 2; // Start from top
    const distance = (value / 100) * radius;
    return {
      x: center.x + Math.cos(angle) * distance,
      y: center.y + Math.sin(angle) * distance
    };
  };

  // Calculate label positions (outside the chart)
  const getLabelPoint = (index: number) => {
    const angle = (index * 2 * Math.PI) / metrics.length - Math.PI / 2;
    const distance = radius + 30;
    return {
      x: center.x + Math.cos(angle) * distance,
      y: center.y + Math.sin(angle) * distance
    };
  };

  // Generate grid lines (concentric pentagons)
  const generateGridLines = () => {
    const gridLevels = [20, 40, 60, 80, 100];
    return gridLevels.map((level, levelIndex) => {
      const points = metrics.map((_, index) => getPoint(index, level));
      const pathData = `M ${points[0].x} ${points[0].y} ` + 
        points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
      
      return (
        <path
          key={level}
          d={pathData}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
          opacity={levelIndex === gridLevels.length - 1 ? 0.8 : 0.4}
        />
      );
    });
  };

  // Generate axis lines from center to each point
  const generateAxisLines = () => {
    return metrics.map((_, index) => {
      const endPoint = getPoint(index, 100);
      return (
        <line
          key={index}
          x1={center.x}
          y1={center.y}
          x2={endPoint.x}
          y2={endPoint.y}
          stroke="#E5E7EB"
          strokeWidth="1"
          opacity="0.6"
        />
      );
    });
  };

  // Generate the filled area for the candidate's scores
  const generateDataArea = () => {
    const points = metrics.map((metric, index) => getPoint(index, metric.value));
    const pathData = `M ${points[0].x} ${points[0].y} ` + 
      points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
    
    return (
      <path
        d={pathData}
        fill="rgba(56, 107, 67, 0.2)"
        stroke="#386B43"
        strokeWidth="2"
      />
    );
  };

  // Generate data points
  const generateDataPoints = () => {
    return metrics.map((metric, index) => {
      const point = getPoint(index, metric.value);
      return (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="#386B43"
          className="drop-shadow-sm"
        />
      );
    });
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <svg width={width} height={height} className="drop-shadow-sm">
          {/* Grid lines */}
          {generateGridLines()}
          
          {/* Axis lines */}
          {generateAxisLines()}
          
          {/* Data area */}
          {generateDataArea()}
          
          {/* Data points */}
          {generateDataPoints()}
          
          {/* Labels */}
          {metrics.map((metric, index) => {
            const labelPoint = getLabelPoint(index);
            const color = radarChartUtils.getRadarMetricColor(metric.value);
            
            return (
              <g key={index}>
                <text
                  x={labelPoint.x}
                  y={labelPoint.y - 5}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700"
                  style={{ fontSize: size === 'sm' ? '10px' : '12px' }}
                >
                  {metric.label}
                </text>
                <text
                  x={labelPoint.x}
                  y={labelPoint.y + 8}
                  textAnchor="middle"
                  className={`text-xs font-bold ${color}`}
                  style={{ fontSize: size === 'sm' ? '11px' : '13px' }}
                >
                  {metric.value}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Legend below the chart */}
      <div className="mt-4 grid grid-cols-1 gap-2 text-center max-w-xs">
        {metrics.map((metric, index) => {
          const statusColor = radarChartUtils.getRadarMetricColor(metric.value);
          const statusText = metric.value >= 80 ? 'Excellent' : 
                            metric.value >= 65 ? 'Good' : 
                            metric.value >= 50 ? 'Average' : 'Needs Improvement';
          
          return (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium">{metric.label}:</span>
              <div className="flex items-center space-x-2">
                <span className={`font-bold ${statusColor}`}>{metric.value}%</span>
                <span className="text-gray-500">({statusText})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 