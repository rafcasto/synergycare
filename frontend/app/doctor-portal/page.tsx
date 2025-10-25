'use client';

import { useState } from 'react';
import { DoctorLayout, DoctorTab } from '@/components/doctor/DoctorLayout';
import DoctorDashboard from '@/components/doctor/DoctorDashboard';
import ScheduleManager from '@/components/doctor/ScheduleManager';
import DoctorAppointments from '@/components/doctor/DoctorAppointments';
import { Card } from '@/components/ui/Card';

export default function DoctorPortalPage() {
  const [currentTab, setCurrentTab] = useState<DoctorTab>('dashboard');

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DoctorDashboard />;
      
      case 'patients':
        return (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Patients</h3>
            <p className="text-gray-600">Patient management interface coming soon...</p>
          </Card>
        );
      
      case 'appointments':
        return <DoctorAppointments />;
      
      case 'schedule':
        return <ScheduleManager />;
      
      case 'settings':
        return (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
            <p className="text-gray-600">Practice settings interface coming soon...</p>
          </Card>
        );
      
      default:
        return <DoctorDashboard />;
    }
  };

  return (
    <DoctorLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderTabContent()}
    </DoctorLayout>
  );
}
