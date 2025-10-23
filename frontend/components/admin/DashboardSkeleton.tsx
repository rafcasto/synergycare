'use client';

import { Card } from '@/components/ui/Card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div>
        <div className="mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts Skeleton */}
      <div>
        <div className="mb-6">
          <div className="h-6 bg-gray-200 rounded w-56 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-80"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div>
        <div className="mb-6">
          <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-72"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-48 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
