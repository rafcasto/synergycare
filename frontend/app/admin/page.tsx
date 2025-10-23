'use client';

import { useState } from 'react';
import { AdminLayout, AdminTab } from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import UserManagement from '@/components/admin/UserManagement';
import { Card } from '@/components/ui/Card';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = () => {
    // Trigger refresh of components when data changes
    setRefreshKey(prev => prev + 1);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard key={refreshKey} />;
      case 'users':
        return (
          <UserManagement
            key={refreshKey}
            onUserCreated={handleDataChange}
            onUserUpdated={handleDataChange}
            onUserDeleted={handleDataChange}
          />
        );
      case 'analytics':
        return (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Advanced Analytics</h3>
              <p className="text-gray-600 max-w-md">
                Detailed analytics and reporting features are coming soon. This will include user engagement metrics, system performance, and business intelligence.
              </p>
            </div>
          </Card>
        );
      case 'settings':
        return (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">System Settings</h3>
              <p className="text-gray-600 max-w-md">
                System configuration and settings management will be available here. This includes security settings, notification preferences, and system maintenance tools.
              </p>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as AdminTab);
  };

  return (
    <AdminLayout currentTab={activeTab} onTabChange={handleTabChange}>
      <div className="transition-opacity duration-200">
        {renderTabContent()}
      </div>
    </AdminLayout>
  );
}
