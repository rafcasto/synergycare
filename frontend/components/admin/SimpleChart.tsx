'use client';

import { Card } from '@/components/ui/Card';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

export interface ChartProps {
  title: string;
  subtitle?: string;
  data: ChartData[];
  type?: 'doughnut' | 'bar' | 'line';
  height?: number;
}

export function SimpleChart({ title, subtitle, data, type = 'doughnut', height = 200 }: ChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderDoughnutChart = () => {
    const radius = 60;
    const centerX = 80;
    const centerY = 80;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    
    let cumulativePercentage = 0;
    
    return (
      <div className="flex items-center space-x-6">
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={strokeWidth}
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativePercentage * circumference / 100;
              
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-500">
                  {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{item.label}</span>
              <span className="font-semibold text-gray-900">{item.value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%',
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      
      <div style={{ height: `${height}px` }} className="flex items-center">
        {type === 'doughnut' && renderDoughnutChart()}
        {type === 'bar' && renderBarChart()}
      </div>
    </Card>
  );
}
