'use client';

import { Card } from '@/components/ui/Card';
import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
    period: string;
  };
  icon: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'gray';
}

const colorVariants = {
  blue: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    changeBg: 'bg-blue-50',
    changeColor: 'text-blue-700',
  },
  green: {
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    changeBg: 'bg-green-50',
    changeColor: 'text-green-700',
  },
  purple: {
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    changeBg: 'bg-purple-50',
    changeColor: 'text-purple-700',
  },
  red: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    changeBg: 'bg-red-50',
    changeColor: 'text-red-700',
  },
  yellow: {
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    changeBg: 'bg-yellow-50',
    changeColor: 'text-yellow-700',
  },
  gray: {
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-600',
    changeBg: 'bg-gray-50',
    changeColor: 'text-gray-700',
  },
};

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  color = 'blue' 
}: MetricCardProps) {
  const colors = colorVariants[color];

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'k';
      }
      return val.toString();
    }
    return val;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7m0 10H7" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10m0-10h10" />
          </svg>
        );
      case 'neutral':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6" />
          </svg>
        );
    }
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
            {change && (
              <div className="flex items-center space-x-1">
                {getTrendIcon(change.trend)}
                <span className={`text-sm font-medium ${
                  change.trend === 'up' ? 'text-green-600' :
                  change.trend === 'down' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {Math.abs(change.value)}%
                </span>
              </div>
            )}
          </div>
          {change && (
            <p className="text-xs text-gray-500 mt-1">
              vs {change.period}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors.iconBg}`}>
          <div className={`w-6 h-6 ${colors.iconColor}`}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}
