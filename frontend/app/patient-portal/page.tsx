'use client';

import { useState } from 'react';
import { PatientLayout, PatientTab } from '@/components/patient/PatientLayout';
import PatientDashboard from '@/components/patient/PatientDashboard';
import PatientAppointments from '@/components/patient/PatientAppointments';
import AppointmentBooking from '@/components/patient/AppointmentBooking';
import { Card } from '@/components/ui/Card';

export default function PatientPortalPage() {
  const [currentTab, setCurrentTab] = useState<PatientTab>('dashboard');
  const [showBookingFlow, setShowBookingFlow] = useState(false);

  const handleBookNewAppointment = () => {
    setShowBookingFlow(true);
    setCurrentTab('appointments');
  };

  const handleCloseBooking = () => {
    setShowBookingFlow(false);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <PatientDashboard 
            onBookNewAppointment={handleBookNewAppointment}
            onFindDoctor={handleBookNewAppointment}
          />
        );
      
      case 'appointments':
        if (showBookingFlow) {
          return (
            <AppointmentBooking 
              onClose={handleCloseBooking}
              initialStep="search"
            />
          );
        }
        return (
          <PatientAppointments 
            onBookNewAppointment={handleBookNewAppointment}
          />
        );
      
      case 'doctors':
        return (
          <AppointmentBooking 
            onClose={() => setCurrentTab('dashboard')}
            initialStep="search"
          />
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
        return (
          <PatientDashboard 
            onBookNewAppointment={handleBookNewAppointment}
            onFindDoctor={handleBookNewAppointment}
          />
        );
    }
  };

  return (
    <PatientLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderTabContent()}
    </PatientLayout>
  );
}
