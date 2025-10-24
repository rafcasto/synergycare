'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DoctorSearch, DoctorProfile, BookingForm, BookingConfirmation } from '@/components';
import { DoctorPublicProfile } from '@/lib/firebase/firestore';
import { AvailabilitySlot } from '@/lib/firebase/firestore';

export type BookingStep = 'search' | 'profile' | 'booking' | 'confirmation';

interface BookingState {
  selectedDoctor: DoctorPublicProfile | null;
  selectedSlot: AvailabilitySlot | null;
  appointmentId: string | null;
  appointmentDetails: {
    notes?: string;
    appointmentType?: 'consultation' | 'follow-up' | 'emergency' | 'routine';
  };
}

interface AppointmentBookingProps {
  onClose?: () => void;
  initialStep?: BookingStep;
}

function AppointmentBooking({ onClose, initialStep = 'search' }: AppointmentBookingProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>(initialStep);
  const [bookingState, setBookingState] = useState<BookingState>({
    selectedDoctor: null,
    selectedSlot: null,
    appointmentId: null,
    appointmentDetails: {}
  });

  const handleDoctorSelect = (doctor: DoctorPublicProfile) => {
    setBookingState(prev => ({
      ...prev,
      selectedDoctor: doctor,
      selectedSlot: null // Reset slot when changing doctor
    }));
    setCurrentStep('profile');
  };

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setBookingState(prev => ({
      ...prev,
      selectedSlot: slot
    }));
    setCurrentStep('booking');
  };

  const handleBookingComplete = (appointmentId: string, details: BookingState['appointmentDetails']) => {
    setBookingState(prev => ({
      ...prev,
      appointmentId,
      appointmentDetails: details
    }));
    setCurrentStep('confirmation');
  };

  const handleBackToSearch = () => {
    setBookingState(prev => ({
      ...prev,
      selectedDoctor: null,
      selectedSlot: null
    }));
    setCurrentStep('search');
  };

  const handleBackToProfile = () => {
    setBookingState(prev => ({
      ...prev,
      selectedSlot: null
    }));
    setCurrentStep('profile');
  };

  const handleStartNewBooking = () => {
    setBookingState({
      selectedDoctor: null,
      selectedSlot: null,
      appointmentId: null,
      appointmentDetails: {}
    });
    setCurrentStep('search');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'search':
        return (
          <DoctorSearch
            onDoctorSelect={handleDoctorSelect}
            onClose={onClose}
          />
        );

      case 'profile':
        return (
          <DoctorProfile
            doctor={bookingState.selectedDoctor!}
            onSlotSelect={handleSlotSelect}
            onBack={handleBackToSearch}
            onClose={onClose}
          />
        );

      case 'booking':
        return (
          <BookingForm
            doctor={bookingState.selectedDoctor!}
            slot={bookingState.selectedSlot!}
            onBookingComplete={handleBookingComplete}
            onBack={handleBackToProfile}
            onClose={onClose}
          />
        );

      case 'confirmation':
        return (
          <BookingConfirmation
            doctor={bookingState.selectedDoctor!}
            slot={bookingState.selectedSlot!}
            appointmentId={bookingState.appointmentId!}
            appointmentDetails={bookingState.appointmentDetails}
            onStartNewBooking={handleStartNewBooking}
            onClose={onClose}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-full">
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {[
            { key: 'search', label: 'Find Doctor', step: 1 },
            { key: 'profile', label: 'Select Time', step: 2 },
            { key: 'booking', label: 'Book Appointment', step: 3 },
            { key: 'confirmation', label: 'Confirmation', step: 4 }
          ].map(({ key, label, step }) => {
            const isActive = currentStep === key;
            const isCompleted = ['search', 'profile', 'booking', 'confirmation'].indexOf(currentStep) > 
                               ['search', 'profile', 'booking', 'confirmation'].indexOf(key);
            
            return (
              <div key={key} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : isCompleted 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {step < 4 && (
                  <svg className="w-4 h-4 mx-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
}

export default AppointmentBooking;
