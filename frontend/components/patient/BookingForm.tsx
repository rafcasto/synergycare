'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DoctorPublicProfile, AvailabilitySlot } from '@/lib/firebase/firestore';
import { BookingService } from '@/lib/firebase/booking';
import { ScheduleService } from '@/lib/firebase/schedule';
import { useAuth } from '@/components/auth/AuthProvider';

interface BookingFormProps {
  doctor: DoctorPublicProfile;
  slot: AvailabilitySlot;
  onBookingComplete: (appointmentId: string, details: BookingDetails) => void;
  onBack: () => void;
  onClose?: () => void;
}

interface BookingDetails {
  notes?: string;
  appointmentType?: 'consultation' | 'follow-up' | 'emergency' | 'routine';
}

const APPOINTMENT_TYPES = [
  { value: 'consultation', label: 'Consultation', description: 'Initial visit or general consultation' },
  { value: 'follow-up', label: 'Follow-up', description: 'Follow-up visit for ongoing treatment' },
  { value: 'routine', label: 'Routine Check-up', description: 'Regular health check-up' },
  { value: 'emergency', label: 'Urgent Care', description: 'Urgent medical attention needed' }
] as const;

function BookingForm({ doctor, slot, onBookingComplete, onBack }: BookingFormProps) {
  const { user } = useAuth();
  const [appointmentType, setAppointmentType] = useState<BookingDetails['appointmentType']>('consultation');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to book an appointment');
      return;
    }

    setIsBooking(true);
    setError(null);

    try {
      const appointmentDetails: BookingDetails = {
        appointmentType
      };

      // Only add notes if they exist and are not empty
      if (notes.trim()) {
        appointmentDetails.notes = notes.trim();
      }

      const appointmentId = await BookingService.bookAppointment(
        user.uid,
        doctor.uid,
        slot.id,
        appointmentDetails
      );

      onBookingComplete(appointmentId, appointmentDetails);
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-start justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center space-x-2"
          disabled={isBooking}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Availability</span>
        </Button>
      </div>

      {/* Appointment Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Doctor</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">{doctor.displayName}</p>
                <p className="text-sm text-blue-600">{doctor.specialization}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Date & Time</h3>
            <div className="space-y-1">
              <p className="font-medium text-gray-900">{formatDate(slot.date)}</p>
              <p className="text-sm text-gray-600">
                {formatTime(slot.startTime)} - {formatTime(slot.endTime)} ({slot.duration} minutes)
              </p>
            </div>
          </div>

          {doctor.consultationFee && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Consultation Fee</h3>
              <p className="text-lg font-bold text-gray-900">${doctor.consultationFee}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Booking Form */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Appointment Details</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Appointment Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {APPOINTMENT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`relative flex cursor-pointer rounded-lg p-4 border-2 transition-colors ${
                    appointmentType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="appointmentType"
                    value={type.value}
                    checked={appointmentType === type.value}
                    onChange={(e) => setAppointmentType(e.target.value as BookingDetails['appointmentType'])}
                    className="sr-only"
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <div className={`font-medium ${
                          appointmentType === type.value ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {type.label}
                        </div>
                        <div className={`${
                          appointmentType === type.value ? 'text-blue-700' : 'text-gray-500'
                        }`}>
                          {type.description}
                        </div>
                      </div>
                    </div>
                    {appointmentType === type.value && (
                      <div className="h-5 w-5 text-blue-600">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Please describe your symptoms, reason for visit, or any special requirements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {notes.length}/500 characters
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isBooking}
            >
              Back
            </Button>
            
            <Button
              type="submit"
              disabled={isBooking}
              className="px-8"
            >
              {isBooking ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Booking...</span>
                </div>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default BookingForm;
