'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookingService } from '@/lib/firebase/booking';
import { ScheduleService } from '@/lib/firebase/schedule';
import { FirestoreService } from '@/lib/firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppointmentBooking } from '@/lib/firebase/booking';


interface PatientAppointmentsProps {
  onBookNewAppointment?: () => void;
}

interface AppointmentWithDoctor extends AppointmentBooking {
  doctorName?: string;
  doctorSpecialization?: string;
}

function PatientAppointments({ onBookNewAppointment }: PatientAppointmentsProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userAppointments = await BookingService.getPatientAppointments(user.uid);
      
      // Fetch doctor profiles for each appointment
      const appointmentsWithDoctors: AppointmentWithDoctor[] = await Promise.all(
        userAppointments.map(async (appointment) => {
          try {
            // First try the doctor_public collection, then fall back to the private doctors collection
            let doctorProfile = null;
            
            // Try public collection first (this is what most components use)
            try {
              const publicDoctors = await FirestoreService.getAllDoctors();
              doctorProfile = publicDoctors.find(doc => doc.uid === appointment.doctorId);
            } catch {
              // Continue to private collection
            }
            
            // If not found in public, try private collection
            if (!doctorProfile) {
              try {
                doctorProfile = await FirestoreService.getDoctorProfile(appointment.doctorId);
              } catch {
                // Continue to name resolution
              }
            }
            
            const finalName = doctorProfile?.displayName || `Dr. ${appointment.doctorId.slice(0, 8)}...`;
            
            return {
              ...appointment,
              doctorName: finalName,
              doctorSpecialization: doctorProfile?.specialization
            };
          } catch {
            // Error fetching doctor profile - using fallback name
            return {
              ...appointment,
              doctorName: `Dr. ${appointment.doctorId.slice(0, 8)}...`,
              doctorSpecialization: undefined
            };
          }
        })
      );
      
      setAppointments(appointmentsWithDoctors);
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

  const isAppointmentCancelable = (appointment: AppointmentWithDoctor) => {
    if (appointment.status !== 'scheduled' && appointment.status !== 'confirmed') {
      return false;
    }
    
    // Can only cancel appointments that are at least 24 hours away
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilAppointment >= 24;
  };

  const isAppointmentToday = (appointment: AppointmentWithDoctor) => {
    const today = new Date().toISOString().split('T')[0];
    return appointment.date === today;
  };

  const getTimeUntilAppointment = (appointment: AppointmentWithDoctor) => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
    const now = new Date();
    const hoursUntil = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil < 1) {
      const minutesUntil = Math.round(hoursUntil * 60);
      return minutesUntil > 0 ? `in ${minutesUntil} minutes` : 'now';
    } else if (hoursUntil < 24) {
      return `in ${Math.round(hoursUntil)} hours`;
    } else {
      const daysUntil = Math.round(hoursUntil / 24);
      return `in ${daysUntil} days`;
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

  // Utility function to sort appointments by date and time
  const sortAppointmentsChronologically = (appointments: AppointmentWithDoctor[], ascending = true) => {
    return appointments.sort((a, b) => {
      const dateComparison = ascending 
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
      
      if (dateComparison !== 0) return dateComparison;
      
      return ascending 
        ? a.startTime.localeCompare(b.startTime)
        : b.startTime.localeCompare(a.startTime);
    });
  };

  // Separate appointments into upcoming and past with proper sorting
  const today = new Date().toISOString().split('T')[0];
  
  // Filter and sort upcoming appointments (future appointments first, chronologically)
  const upcomingAppointments = sortAppointmentsChronologically(
    appointments.filter(apt => 
      apt.date >= today && apt.status !== 'cancelled' && apt.status !== 'completed'
    ),
    true // ascending order for upcoming appointments
  );
  
  // Filter and sort past appointments (most recent past appointments first)
  const pastAppointments = sortAppointmentsChronologically(
    appointments.filter(apt => 
      apt.date < today || apt.status === 'cancelled' || apt.status === 'completed'
    ),
    false // descending order for past appointments
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

      {/* Statistics Cards */}
      {appointments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => isAppointmentToday(apt) && apt.status !== 'cancelled').length}
                </div>
                <div className="text-sm text-gray-600">Today</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {new Set(appointments.map(apt => apt.doctorId)).size}
                </div>
                <div className="text-sm text-gray-600">Doctors</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Today's Appointments */}
      {upcomingAppointments.filter(apt => isAppointmentToday(apt)).length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
            Today&apos;s Appointments
          </h2>
          <div className="space-y-4">
            {upcomingAppointments.filter(apt => isAppointmentToday(apt)).map((appointment) => (
              <Card key={appointment.id} className="p-6 border-l-4 border-orange-500 bg-orange-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.doctorName}
                        </h3>
                        {appointment.doctorSpecialization && (
                          <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {appointment.doctorSpecialization}
                          </span>
                        )}
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
                          <span className="font-medium text-orange-700">TODAY</span> at{' '}
                          <span className="font-medium">
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </span>
                          <span className="ml-2 text-sm text-orange-600 font-medium">
                            ({getTimeUntilAppointment(appointment)})
                          </span>
                        </p>
                        
                        <p className="text-sm text-gray-500">
                          Duration: {appointment.duration} minutes
                        </p>
                        
                        {appointment.notes && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">Notes:</span> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {appointment.status === 'confirmed' && (
                      <div className="flex items-center space-x-3">
                        {appointment.videoConference && (
                          <Button
                            size="sm"
                            onClick={() => {
                              // Navigate to video conference page
                              window.open(`/video-conference/${appointment.id}`, '_blank');
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Join Video Call
                          </Button>
                        )}
                        {/* Debug: Show if appointment needs video setup */}
                        {!appointment.videoConference && process.env.NODE_ENV === 'development' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await BookingService.addVideoConferenceToAppointment(appointment.id!);
                                alert('Video conference room created! Please refresh the page.');
                                window.location.reload();
                              } catch (error) {
                                console.error('Error creating video room:', error);
                                alert('Failed to create video room. Check console for details.');
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Video Room
                          </Button>
                        )}
                        <div className="text-right">
                          <div className="text-green-600 font-medium text-sm mb-1">✓ Ready for appointment</div>
                          <div className="text-xs text-gray-500">
                            {appointment.videoConference ? 'Video call available' : 
                             process.env.NODE_ENV === 'development' ? 'Click "Create Video Room" to enable video' : 
                             'Contact support to enable video call'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.filter(apt => !isAppointmentToday(apt)).length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Appointments ({upcomingAppointments.filter(apt => !isAppointmentToday(apt)).length})
          </h2>
          <p className="text-sm text-gray-600 mb-4">Showing your future appointments in chronological order</p>
          <div className="space-y-4">
            {upcomingAppointments.filter(apt => !isAppointmentToday(apt)).map((appointment) => (
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
                          {appointment.doctorName}
                        </h3>
                        {appointment.doctorSpecialization && (
                          <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {appointment.doctorSpecialization}
                          </span>
                        )}
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
                          {isAppointmentToday(appointment) && (
                            <span className="ml-2 text-sm text-orange-600 font-medium">
                              ({getTimeUntilAppointment(appointment)})
                            </span>
                          )}
                        </p>
                        
                        <p className="text-sm text-gray-500">
                          Duration: {appointment.duration} minutes
                        </p>
                        
                        {appointment.notes && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">Notes:</span> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {isAppointmentToday(appointment) && appointment.status === 'confirmed' && (
                      <div className="text-right">
                        <div className="text-green-600 font-medium text-sm mb-1">Ready for appointment</div>
                        <div className="text-xs text-gray-500">Check in when you arrive</div>
                      </div>
                    )}
                    
                    {isAppointmentCancelable(appointment) && (
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
                    )}
                    
                    {!isAppointmentCancelable(appointment) && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Cannot cancel</div>
                        <div className="text-xs text-gray-400">Less than 24h away</div>
                      </div>
                    )}
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
          <p className="text-sm text-gray-600 mb-4">Your appointment history (most recent first)</p>
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
                        {appointment.doctorName}
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
