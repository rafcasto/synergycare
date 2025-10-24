'use client';

import { AvailabilitySlotFixer } from '@/components/debug/AvailabilitySlotFixer';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Debug Tools</h1>
          <p className="text-gray-600">
            Development utilities for fixing data issues and testing functionality
          </p>
        </div>

        <div className="space-y-8">
          <AvailabilitySlotFixer />
        </div>
      </div>
    </div>
  );
}
