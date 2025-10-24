'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookingService } from '@/lib/firebase/booking';
import { ScheduleService } from '@/lib/firebase/schedule';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppointmentBooking } from '@/lib/firebase/booking';

interface PatientAppointmentsProps {
  onBookNewAppointment?: () => void;
}

function PatientAppointments({ onBookNewAppointment }: PatientAppointmentsProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userAppointments = await BookingService.getPatientAppointments(user.uid);
      setAppointments(userAppointments);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, loadAppointments]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!user || !confirm('Are you sure you want to cancel this appointment?')) return;

    setCancelingId(appointmentId);

    try {
      await BookingService.cancelAppointment(appointmentId, user.uid, 'patient');
      await loadAppointments(); // Refresh the list
    } catch (err) {
      console.error('Error canceling appointment:', err);
      alert(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setCancelingId(null);
    }
  };

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
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (timeStr: string) => {
    return ScheduleService.formatTime(timeStr, true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentTypeColor = (type?: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-green-100 text-green-800';
      case 'routine': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentTypeLabel = (type?: string) => {
    switch (type) {
      case 'consultation': return 'Consultation';
      case 'follow-up': return 'Follow-up';
      case 'routine': return 'Routine';
      case 'emergency': return 'Emergency';
      default: return 'Consultation';
    }
  };

  // Separate appointments into upcoming and past
  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments.filter(apt => 
    apt.date >= today && apt.status !== 'cancelled' && apt.status !== 'completed'
  );
  const pastAppointments = appointments.filter(apt => 
    apt.date < today || apt.status === 'cancelled' || apt.status === 'completed'
  );

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Appointments</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadAppointments}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="p-3 bg-blue-100 rounded-full inline-block mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments Yet</h3>
        <p className="text-gray-600 mb-6">
          You haven&apos;t booked any appointments. Start by finding a doctor and booking your first appointment.
        </p>
        {onBookNewAppointment && (
          <Button onClick={onBookNewAppointment} className="px-6">
            Book Your First Appointment
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600">Manage your upcoming and past appointments</p>
        </div>
        {onBookNewAppointment && (
          <Button onClick={onBookNewAppointment} className="px-6">
            Book New Appointment
          </Button>
        )}
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Appointments ({upcomingAppointments.length})
          </h2>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {appointment.doctorId} {/* Note: We'd need to fetch doctor name */}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                        {appointment.appointmentType && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAppointmentTypeColor(appointment.appointmentType)}`}>
                            {getAppointmentTypeLabel(appointment.appointmentType)}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          <span className="font-medium">{formatDate(appointment.date)}</span> at{' '}
                          <span className="font-medium">
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </span>
                        </p>
                        
                        {appointment.notes && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            Notes: {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelAppointment(appointment.id!)}
                      disabled={cancelingId === appointment.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {cancelingId === appointment.id ? (
                        <div className="flex items-center space-x-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                          <span>Canceling...</span>
                        </div>
                      ) : (
                        'Cancel'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Past Appointments ({pastAppointments.length})
          </h2>
          <div className="space-y-4">
            {pastAppointments.slice(0, 5).map((appointment) => (
              <Card key={appointment.id} className="p-6 opacity-75">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-base font-medium text-gray-700">
                        Dr. {appointment.doctorId} {/* Note: We'd need to fetch doctor name */}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      {appointment.appointmentType && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAppointmentTypeColor(appointment.appointmentType)}`}>
                          {getAppointmentTypeLabel(appointment.appointmentType)}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      {formatDate(appointment.date)} at {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            
            {pastAppointments.length > 5 && (
              <Card className="p-4 text-center">
                <p className="text-gray-500">
                  And {pastAppointments.length - 5} more past appointments...
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientAppointments;
