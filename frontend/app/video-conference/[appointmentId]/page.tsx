'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import VideoConference from '@/components/video/VideoConference';
import { BookingService, AppointmentBooking } from '@/lib/firebase/booking';
import { FirestoreService } from '@/lib/firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';

export default function VideoConferencePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<AppointmentBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'doctor' | 'patient' | 'relative'>('relative');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const appointmentId = params?.appointmentId as string;

  useEffect(() => {
    const loadAppointmentData = async () => {
      if (!appointmentId) {
        setError('Invalid appointment ID');
        setLoading(false);
        return;
      }

      try {
        const appointmentData = await BookingService.getAppointment(appointmentId);
        
        if (!appointmentData) {
          setError('Appointment not found');
          setLoading(false);
          return;
        }

        if (!appointmentData.videoConference) {
          setError('Video conference not available for this appointment');
          setLoading(false);
          return;
        }

        setAppointment(appointmentData);

        // Determine user role and get user info
        if (user) {
          if (user.uid === appointmentData.doctorId) {
            setUserRole('doctor');
            // Get doctor profile
            try {
              const doctorProfile = await FirestoreService.getDoctorProfile(user.uid);
              setUserName(doctorProfile?.displayName || user.displayName || 'Doctor');
              setUserEmail(user.email || '');
            } catch (err) {
              console.error('Error loading doctor profile:', err);
              setUserName(user.displayName || 'Doctor');
              setUserEmail(user.email || '');
            }
          } else if (user.uid === appointmentData.patientId) {
            setUserRole('patient');
            // Get patient profile
            try {
              const patientProfile = await FirestoreService.getPatientProfile(user.uid);
              setUserName(patientProfile?.displayName || user.displayName || 'Patient');
              setUserEmail(user.email || '');
            } catch (err) {
              console.error('Error loading patient profile:', err);
              setUserName(user.displayName || 'Patient');
              setUserEmail(user.email || '');
            }
          } else {
            setUserRole('relative');
            setUserName(user.displayName || 'Family Member');
            setUserEmail(user.email || '');
          }
        } else {
          // Anonymous user (relative with direct link)
          setUserRole('relative');
          setUserName('Family Member');
        }

      } catch (err) {
        console.error('Error loading appointment:', err);
        setError('Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    loadAppointmentData();
  }, [appointmentId, user]);

  const handleConferenceEnd = () => {
    // Redirect based on user role
    if (userRole === 'doctor') {
      router.push('/doctor-portal?tab=appointments');
    } else if (userRole === 'patient') {
      router.push('/patient-portal?tab=appointments');
    } else {
      // For relatives, show a thank you message
      router.push('/');
    }
  };

  const handleConferenceError = (error: string) => {
    console.error('Video conference error:', error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Video Conference</h2>
          <p className="text-gray-600">Please wait while we prepare your video call...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Join</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Telehealth Consultation
              </h1>
              <p className="text-gray-600">
                {new Date(appointment.date + 'T' + appointment.startTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} at {appointment.startTime}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                userRole === 'doctor' ? 'bg-blue-100 text-blue-800' :
                userRole === 'patient' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {userRole === 'doctor' ? 'Doctor' : 
                 userRole === 'patient' ? 'Patient' : 
                 'Family Member'}
              </div>
            </div>
          </div>
        </div>

        {/* Video Conference Component */}
        <VideoConference
          appointment={appointment}
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          onConferenceEnd={handleConferenceEnd}
          onConferenceError={handleConferenceError}
        />

        {/* Additional Information */}
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Information</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">For the best experience:</h4>
              <ul className="space-y-1">
                <li>• Use a stable internet connection</li>
                <li>• Ensure good lighting on your face</li>
                <li>• Find a quiet, private location</li>
                <li>• Test your camera and microphone beforehand</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Privacy & Security:</h4>
              <ul className="space-y-1">
                <li>• This is a secure, encrypted video call</li>
                <li>• Do not record without consent</li>
                <li>• Only authorized participants should join</li>
                <li>• The call is not recorded by default</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
