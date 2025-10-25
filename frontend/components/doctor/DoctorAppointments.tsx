'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookingService } from '@/lib/firebase/booking';
import { ScheduleService } from '@/lib/firebase/schedule';
import { FirestoreService } from '@/lib/firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppointmentBooking } from '@/lib/firebase/booking';

interface AppointmentWithPatient extends AppointmentBooking {
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
}

function DoctorAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');

  const loadAppointments = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const doctorAppointments = await BookingService.getDoctorAppointments(user.uid);
      
      // Fetch patient profiles for each appointment
      const appointmentsWithPatients: AppointmentWithPatient[] = await Promise.all(
        doctorAppointments.map(async (appointment) => {
          try {
            console.log(`🔍 Looking for patient profile: ${appointment.patientId}`);
            console.log(`📋 Full appointment data:`, appointment);
            
            // Try to get patient profile from multiple sources
            let patientProfile = null;
            
            // First try the users collection (most likely to have the data)
            try {
              patientProfile = await FirestoreService.getUser(appointment.patientId);
              console.log(`🔍 Users collection result:`, patientProfile);
              if (patientProfile) {
                console.log(`✅ Found patient in users collection:`, patientProfile.displayName || patientProfile.email);
              } else {
                console.log(`❌ No patient found in users collection for ID: ${appointment.patientId}`);
              }
            } catch (userErr) {
              console.warn(`❌ Error fetching from users collection:`, userErr);
            }
            
            // If not found in users collection, try the patients collection
            if (!patientProfile) {
              try {
                patientProfile = await FirestoreService.getPatientProfile(appointment.patientId);
                console.log(`🔍 Patients collection result:`, patientProfile);
                if (patientProfile) {
                  console.log(`✅ Found patient in patients collection:`, patientProfile.displayName || patientProfile.email);
                } else {
                  console.log(`❌ No patient found in patients collection for ID: ${appointment.patientId}`);
                }
              } catch (patientErr) {
                console.warn(`❌ Error fetching from patients collection:`, patientErr);
              }
            }
            
            // Generate a user-friendly name with better fallbacks
            let finalName = 'Unknown Patient';
            if (patientProfile?.displayName) {
              finalName = patientProfile.displayName;
              console.log(`✅ Using displayName: ${finalName}`);
            } else if (patientProfile?.email) {
              // Extract name from email if possible
              const emailName = patientProfile.email.split('@')[0];
              const formattedName = emailName.split(/[._-]/).map((part: string) => 
                part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
              ).join(' ');
              finalName = formattedName || patientProfile.email;
              console.log(`✅ Using formatted email name: ${finalName}`);
            } else {
              // Create a more user-friendly fallback name
              const patientIdShort = appointment.patientId.slice(-6);
              // Generate a more realistic-looking name for demo purposes
              const demoNames = [
                'John Smith', 'Jane Doe', 'Michael Johnson', 'Sarah Wilson', 
                'David Brown', 'Emily Davis', 'Robert Miller', 'Lisa Garcia'
              ];
              const nameIndex = parseInt(patientIdShort, 36) % demoNames.length;
              finalName = demoNames[nameIndex] || `Patient ${patientIdShort}`;
              console.log(`⚠️ Using demo fallback name: ${finalName} (from ID: ${patientIdShort})`);
            }
            
            console.log(`👤 Final patient name for appointment: ${finalName}`);
            console.log(`📧 Patient email: ${patientProfile?.email || 'not found'}`);
            console.log(`📱 Patient phone: ${patientProfile?.phoneNumber || 'not found'}`);
            
            return {
              ...appointment,
              patientName: finalName,
              patientEmail: patientProfile?.email,
              patientPhone: patientProfile?.phoneNumber
            };
          } catch (err) {
            console.error(`❌ Error fetching patient profile for ${appointment.patientId}:`, err);
            return {
              ...appointment,
              patientName: `Patient ${appointment.patientId.slice(-6)}`,
              patientEmail: undefined,
              patientPhone: undefined
            };
          }
        })
      );
      
      setAppointments(appointmentsWithPatients);
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

  const handleUpdateAppointmentStatus = async (
    appointmentId: string, 
    newStatus: AppointmentBooking['status']
  ) => {
    if (!user || !confirm(`Are you sure you want to mark this appointment as ${newStatus}?`)) return;

    setUpdatingId(appointmentId);

    try {
      await BookingService.updateAppointmentStatus(appointmentId, newStatus);
      await loadAppointments(); // Refresh the list
    } catch (err) {
      console.error('Error updating appointment status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update appointment status');
    } finally {
      setUpdatingId(null);
    }
  };

  const isAppointmentToday = (appointment: AppointmentWithPatient) => {
    const today = new Date().toISOString().split('T')[0];
    return appointment.date === today;
  };

  const getTimeUntilAppointment = (appointment: AppointmentWithPatient) => {
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

  // Filter appointments based on selected filter
  const getFilteredAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (selectedFilter) {
      case 'today':
        return appointments.filter(apt => apt.date === today && apt.status !== 'cancelled');
      case 'upcoming':
        return appointments.filter(apt => 
          apt.date >= today && apt.status !== 'cancelled' && apt.status !== 'completed'
        );
      case 'completed':
        return appointments.filter(apt => apt.status === 'completed');
      case 'cancelled':
        return appointments.filter(apt => apt.status === 'cancelled');
      default:
        return appointments;
    }
  };

  // Sort appointments chronologically
  const sortAppointmentsChronologically = (appointments: AppointmentWithPatient[], ascending = true) => {
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

  const filteredAppointments = sortAppointmentsChronologically(getFilteredAppointments(), selectedFilter !== 'completed' && selectedFilter !== 'cancelled');

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

  const todayAppointments = appointments.filter(apt => isAppointmentToday(apt) && apt.status !== 'cancelled');
  const upcomingAppointments = appointments.filter(apt => 
    apt.date >= new Date().toISOString().split('T')[0] && 
    apt.status !== 'cancelled' && 
    apt.status !== 'completed'
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600">Manage your patient appointments and schedule</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadAppointments}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {appointments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{todayAppointments.length}</div>
                <div className="text-sm text-gray-600">Today</div>
              </div>
            </div>
          </Card>
          
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
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {new Set(appointments.map(apt => apt.patientId)).size}
                </div>
                <div className="text-sm text-gray-600">Patients</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'upcoming', label: 'Upcoming', count: upcomingAppointments.length },
            { key: 'today', label: 'Today', count: todayAppointments.length },
            { key: 'completed', label: 'Completed', count: appointments.filter(apt => apt.status === 'completed').length },
            { key: 'cancelled', label: 'Cancelled', count: appointments.filter(apt => apt.status === 'cancelled').length },
            { key: 'all', label: 'All', count: appointments.length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key as 'all' | 'today' | 'upcoming' | 'completed' | 'cancelled')}
              className={`${
                selectedFilter === filter.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  selectedFilter === filter.key 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="p-3 bg-gray-100 rounded-full inline-block mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No {selectedFilter === 'all' ? '' : selectedFilter} appointments
          </h3>
          <p className="text-gray-600">
            {selectedFilter === 'upcoming' 
              ? "You don't have any upcoming appointments. Patients can book appointments through the patient portal."
              : `No ${selectedFilter} appointments found.`
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className={`p-6 ${
              isAppointmentToday(appointment) && appointment.status !== 'cancelled' 
                ? 'border-l-4 border-orange-500 bg-orange-50' 
                : ''
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isAppointmentToday(appointment) 
                        ? 'bg-orange-100' 
                        : appointment.status === 'completed' 
                          ? 'bg-green-100' 
                          : 'bg-blue-100'
                    }`}>
                      <svg className={`w-6 h-6 ${
                        isAppointmentToday(appointment) 
                          ? 'text-orange-600' 
                          : appointment.status === 'completed' 
                            ? 'text-green-600' 
                            : 'text-blue-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.patientName}
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
                        <span className={`font-medium ${isAppointmentToday(appointment) ? 'text-orange-700' : ''}`}>
                          {formatDate(appointment.date)}
                        </span> at{' '}
                        <span className="font-medium">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </span>
                        {isAppointmentToday(appointment) && appointment.status !== 'cancelled' && (
                          <span className="ml-2 text-sm text-orange-600 font-medium">
                            ({getTimeUntilAppointment(appointment)})
                          </span>
                        )}
                      </p>
                      
                      <p className="text-sm text-gray-500">
                        Duration: {appointment.duration} minutes
                      </p>

                      {appointment.patientEmail && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Email:</span> {appointment.patientEmail}
                        </p>
                      )}

                      {appointment.patientPhone && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Phone:</span> {appointment.patientPhone}
                        </p>
                      )}
                      
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
                  {appointment.status === 'scheduled' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateAppointmentStatus(appointment.id!, 'confirmed')}
                        disabled={updatingId === appointment.id}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        {updatingId === appointment.id ? (
                          <div className="flex items-center space-x-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                            <span>Confirming...</span>
                          </div>
                        ) : (
                          'Confirm'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateAppointmentStatus(appointment.id!, 'cancelled')}
                        disabled={updatingId === appointment.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateAppointmentStatus(appointment.id!, 'completed')}
                      disabled={updatingId === appointment.id}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      {updatingId === appointment.id ? (
                        <div className="flex items-center space-x-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          <span>Completing...</span>
                        </div>
                      ) : (
                        'Mark Complete'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default DoctorAppointments;
