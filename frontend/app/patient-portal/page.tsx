'use client';

import { useState } from 'react';
import { PatientLayout, PatientTab } from '@/components/patient/PatientLayout';
import PatientDashboard from '@/components/patient/PatientDashboard';
import { Card } from '@/components/ui/Card';

export default function PatientPortalPage() {
  const [currentTab, setCurrentTab] = useState<PatientTab>('dashboard');

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <PatientDashboard />;
      
      case 'appointments':
        return (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Appointments</h3>
            <p className="text-gray-600">Appointment management interface coming soon...</p>
          </Card>
        );
      
      case 'doctors':
        return (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Find Doctors</h3>
            <p className="text-gray-600">Doctor search interface coming soon...</p>
          </Card>
        );
      
      case 'records':
        return (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Records</h3>
            <p className="text-gray-600">Medical records interface coming soon...</p>
          </Card>
        );
      
      case 'settings':
        return (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
            <p className="text-gray-600">Account settings interface coming soon...</p>
          </Card>
        );
      
      default:
        return <PatientDashboard />;
    }
  };

  return (
    <PatientLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderTabContent()}
    </PatientLayout>
  );
}
