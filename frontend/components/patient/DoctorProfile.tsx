'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DoctorPublicProfile, AvailabilitySlot } from '@/lib/firebase/firestore';
import { BookingService } from '@/lib/firebase/booking';
import { ScheduleService } from '@/lib/firebase/schedule';

interface DoctorProfileProps {
  doctor: DoctorPublicProfile;
  onSlotSelect: (slot: AvailabilitySlot) => void;
  onBack: () => void;
  onClose?: () => void;
}

interface GroupedSlots {
  [date: string]: AvailabilitySlot[];
}

function DoctorProfile({ doctor, onSlotSelect, onBack }: DoctorProfileProps) {
  const [groupedSlots, setGroupedSlots] = useState<GroupedSlots>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get available slots for the next 30 days
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const toDate = endDate.toISOString().split('T')[0];

      const slots = await BookingService.getAvailableSlots(doctor.uid, today, toDate);
      
      // Group slots by date
      const grouped: GroupedSlots = {};
      slots.forEach(slot => {
        if (!grouped[slot.date]) {
          grouped[slot.date] = [];
        }
        grouped[slot.date].push(slot);
      });

      // Sort slots within each date
      Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
      });

      setGroupedSlots(grouped);

      // Auto-select first available date
      const firstDate = Object.keys(grouped).sort()[0];
      if (firstDate) {
        setSelectedDate(firstDate);
      }
    } catch (err) {
      console.error('Error loading availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [doctor.uid]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timeStr: string) => {
    return ScheduleService.formatTime(timeStr, true);
  };

  const availableDates = Object.keys(groupedSlots).sort();

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading availability...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="p-3 bg-red-100 rounded-full inline-block mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Availability</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <Button onClick={loadAvailability}>
              Try Again
            </Button>
            <Button variant="outline" onClick={onBack}>
              Back to Search
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with doctor info and back button */}
      <div className="flex items-start justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Search</span>
        </Button>
      </div>

      {/* Doctor Info Card */}
      <Card className="p-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {doctor.displayName}
                </h1>
                <p className="text-lg text-blue-600 font-medium mb-3">
                  {doctor.specialization}
                </p>
                
                <div className="space-y-2">
                  {doctor.hospitalAffiliation && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {doctor.hospitalAffiliation}
                    </div>
                  )}
                  
                  {doctor.experienceYears && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {doctor.experienceYears} years experience
                    </div>
                  )}

                  {doctor.rating && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {doctor.rating}/5 {doctor.reviewCount && `(${doctor.reviewCount} reviews)`}
                    </div>
                  )}
                </div>

                {doctor.bio && (
                  <p className="text-gray-600 mt-4 max-w-2xl">
                    {doctor.bio}
                  </p>
                )}
              </div>
              
              {doctor.consultationFee && (
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Consultation Fee</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${doctor.consultationFee}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Availability Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Appointments</h2>
        
        {availableDates.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-3 bg-gray-100 rounded-full inline-block mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Availability</h3>
            <p className="text-gray-600 mb-4">
              This doctor doesn&apos;t have any available appointments in the next 30 days.
            </p>
            <Button variant="outline" onClick={onBack}>
              Try Another Doctor
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Date Selection */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Date</h3>
              <div className="space-y-2">
                {availableDates.map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedDate === date
                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{formatDate(date)}</div>
                    <div className="text-sm text-gray-600">
                      {groupedSlots[date].length} slot{groupedSlots[date].length !== 1 ? 's' : ''} available
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Available Times
                {selectedDate && (
                  <span className="text-base font-normal text-gray-600 ml-2">
                    for {formatDate(selectedDate)}
                  </span>
                )}
              </h3>
              
              {selectedDate && groupedSlots[selectedDate] ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {groupedSlots[selectedDate].map((slot) => (
                    <Button
                      key={slot.id}
                      variant="outline"
                      onClick={() => onSlotSelect(slot)}
                      className="p-3 h-auto flex flex-col items-center hover:bg-blue-50 hover:border-blue-300"
                    >
                      <div className="font-medium">
                        {formatTime(slot.startTime)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {slot.duration} min
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select a date to view available times
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default DoctorProfile;
