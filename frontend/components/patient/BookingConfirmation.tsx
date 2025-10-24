'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DoctorPublicProfile, AvailabilitySlot } from '@/lib/firebase/firestore';
import { ScheduleService } from '@/lib/firebase/schedule';

interface BookingConfirmationProps {
  doctor: DoctorPublicProfile;
  slot: AvailabilitySlot;
  appointmentId: string;
  appointmentDetails: {
    notes?: string;
    appointmentType?: 'consultation' | 'follow-up' | 'emergency' | 'routine';
  };
  onStartNewBooking: () => void;
  onClose?: () => void;
}

function BookingConfirmation({ 
  doctor, 
  slot, 
  appointmentId, 
  appointmentDetails, 
  onStartNewBooking,
  onClose 
}: BookingConfirmationProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    return ScheduleService.formatTime(timeStr, true);
  };

  const getAppointmentTypeLabel = (type?: string) => {
    switch (type) {
      case 'consultation': return 'Consultation';
      case 'follow-up': return 'Follow-up';
      case 'routine': return 'Routine Check-up';
      case 'emergency': return 'Urgent Care';
      default: return 'Consultation';
    }
  };

  const addToCalendar = () => {
    const startDate = new Date(`${slot.date}T${slot.startTime}:00`);
    const endDate = new Date(`${slot.date}T${slot.endTime}:00`);
    
    const title = `Appointment with ${doctor.displayName}`;
    const details = `${getAppointmentTypeLabel(appointmentDetails.appointmentType)} with ${doctor.displayName} (${doctor.specialization})`;
    
    // Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(details)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Appointment Confirmed!
        </h1>
        <p className="text-gray-600 mb-4">
          Your appointment has been successfully booked. You will receive a confirmation email shortly.
        </p>
        
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Appointment ID: {appointmentId.slice(-8).toUpperCase()}
        </div>
      </Card>

      {/* Appointment Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Appointment Details</h2>
        
        <div className="space-y-6">
          {/* Doctor Information */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {doctor.displayName}
              </h3>
              <p className="text-blue-600 font-medium mb-2">
                {doctor.specialization}
              </p>
              
              {doctor.hospitalAffiliation && (
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {doctor.hospitalAffiliation}
                </div>
              )}
            </div>
            
            {doctor.consultationFee && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Fee</p>
                <p className="text-lg font-bold text-gray-900">${doctor.consultationFee}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Date & Time</h4>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{formatDate(slot.date)}</p>
                  <p className="text-gray-600">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </p>
                  <p className="text-sm text-gray-500">Duration: {slot.duration} minutes</p>
                </div>
              </div>

              {/* Appointment Type */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Appointment Type</h4>
                <p className="font-medium text-gray-900">
                  {getAppointmentTypeLabel(appointmentDetails.appointmentType)}
                </p>
              </div>
            </div>

            {/* Notes */}
            {appointmentDetails.notes && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Notes</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{appointmentDetails.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Important Information */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Important Information</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Please arrive 15 minutes early for your appointment.</p>
          </div>
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Bring a valid ID and your insurance card if applicable.</p>
          </div>
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p>If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={addToCalendar}
          variant="outline"
          className="flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Add to Calendar</span>
        </Button>

        <Button
          onClick={onStartNewBooking}
          variant="outline"
          className="flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Book Another Appointment</span>
        </Button>

        <Button
          onClick={onClose}
          className="flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
          <span>Go to My Appointments</span>
        </Button>
      </div>
    </div>
  );
}

export default BookingConfirmation;
