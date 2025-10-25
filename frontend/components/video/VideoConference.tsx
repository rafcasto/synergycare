'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppointmentBooking } from '@/lib/firebase/booking';
import { VideoConferenceService, JitsiConfig } from '@/lib/services/videoConference';

interface JitsiMeetAPI {
  dispose: () => void;
  addEventListener: (event: string, handler: (data: unknown) => void) => void;
  removeEventListener: (event: string, handler: (data: unknown) => void) => void;
}

interface VideoConferenceProps {
  appointment: AppointmentBooking;
  userRole: 'doctor' | 'patient' | 'relative';
  userName: string;
  userEmail?: string;
  onConferenceEnd?: () => void;
  onConferenceError?: (error: string) => void;
}

interface DeviceCapabilities {
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasWebRTC: boolean;
}

export default function VideoConference({
  appointment,
  userRole,
  userName,
  userEmail,
  onConferenceEnd,
  onConferenceError
}: VideoConferenceProps) {
  const [jitsiApi, setJitsiApi] = useState<JitsiMeetAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const meetingContainerRef = useRef<HTMLDivElement>(null);

  // Check device capabilities on mount
  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const capabilities = await VideoConferenceService.checkDeviceCapabilities();
        setDeviceCapabilities(capabilities);
        
        if (!capabilities.hasWebRTC) {
          setError('Your browser does not support video calls. Please update your browser or try a different one.');
          onConferenceError?.('WebRTC not supported');
        }
      } catch (err) {
        console.error('Error checking device capabilities:', err);
        setError('Could not access camera or microphone. Please check your permissions.');
        onConferenceError?.('Device access error');
      }
      setIsLoading(false);
    };

    checkCapabilities();
  }, [onConferenceError]);

  const joinMeeting = useCallback(async () => {
    if (!appointment.videoConference || !meetingContainerRef.current) {
      setError('Video conference not available for this appointment');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const config: JitsiConfig = {
        domain: 'meet.jit.si',
        roomName: appointment.videoConference.roomName,
        displayName: userName,
        email: userEmail,
        userRole,
        width: '100%',
        height: '500px',
        parentNode: meetingContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: userRole !== 'doctor',
          startWithVideoMuted: false,
          enableEmailInStats: false,
          enableWelcomePage: false,
          prejoinPageEnabled: true,
          toolbarButtons: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'raisehand', 'videoquality',
            'filmstrip', 'invite', 'tileview', 'select-background', 'help'
          ]
        },
        interfaceConfigOverwrite: {
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false
        }
      };

      const api = await VideoConferenceService.createJitsiMeeting(config);
      setJitsiApi(api as JitsiMeetAPI);

      // Add event listeners
      api.addEventListener('videoConferenceJoined', () => {
        console.log('User joined the conference');
        setIsJoining(false);
      });

      api.addEventListener('videoConferenceLeft', () => {
        console.log('User left the conference');
        onConferenceEnd?.();
      });

      api.addEventListener('readyToClose', () => {
        console.log('Conference is ready to close');
        VideoConferenceService.cleanupJitsiInstance(api);
        setJitsiApi(null);
        onConferenceEnd?.();
      });

      api.addEventListener('participantJoined', (participant: unknown) => {
        console.log('Participant joined:', participant);
      });

      api.addEventListener('participantLeft', (participant: unknown) => {
        console.log('Participant left:', participant);
      });

    } catch (err) {
      console.error('Error joining meeting:', err);
      setError('Failed to join the video call. Please try again.');
      onConferenceError?.(err instanceof Error ? err.message : 'Failed to join meeting');
      setIsJoining(false);
    }
  }, [appointment, userName, userEmail, userRole, onConferenceEnd, onConferenceError]);

  const leaveMeeting = useCallback(() => {
    if (jitsiApi) {
      VideoConferenceService.cleanupJitsiInstance(jitsiApi);
      setJitsiApi(null);
    }
    onConferenceEnd?.();
  }, [jitsiApi, onConferenceEnd]);

  const shareWithRelatives = () => {
    if (!appointment.videoConference) return;
    
    VideoConferenceService.generateRelativeInviteData(
      appointment.videoConference,
      'Patient', // You might want to pass actual patient name
      'Doctor'   // You might want to pass actual doctor name
    );
    
    setShowInviteModal(true);
  };

  const copyInviteLink = async () => {
    if (!appointment.videoConference) return;
    
    try {
      await navigator.clipboard.writeText(appointment.videoConference.relativesJoinUrl);
      alert('Invite link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = appointment.videoConference.relativesJoinUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Invite link copied to clipboard!');
    }
  };

  const shareViaWhatsApp = () => {
    if (!appointment.videoConference) return;
    
    const message = encodeURIComponent(`Join my telehealth appointment: ${appointment.videoConference.relativesJoinUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaEmail = () => {
    if (!appointment.videoConference) return;
    
    const inviteData = VideoConferenceService.generateRelativeInviteData(
      appointment.videoConference,
      'Patient',
      'Doctor'
    );
    
    const subject = encodeURIComponent(inviteData.emailSubject);
    const body = encodeURIComponent(inviteData.emailBody);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Checking device compatibility...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Call Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!appointment.videoConference) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Call Not Available</h3>
          <p className="text-gray-600">The doctor hasn&apos;t set up the video call for this appointment yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pre-join controls */}
      {!jitsiApi && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Video Consultation</h3>
          
          {/* Device status */}
          {deviceCapabilities && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${deviceCapabilities.hasCamera ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  Camera: {deviceCapabilities.hasCamera ? 'Available' : 'Not detected'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${deviceCapabilities.hasMicrophone ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  Microphone: {deviceCapabilities.hasMicrophone ? 'Available' : 'Not detected'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={joinMeeting}
                disabled={isJoining}
                className="px-6"
              >
                {isJoining ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Joining...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Join Video Call</span>
                  </div>
                )}
              </Button>

              {(userRole === 'patient' || userRole === 'doctor') && (
                <Button
                  onClick={shareWithRelatives}
                  variant="outline"
                  className="px-4"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Invite Family
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Jitsi Meet container */}
      <Card className="p-0 overflow-hidden">
        <div ref={meetingContainerRef} className="w-full min-h-[500px] bg-gray-900 rounded-lg">
          {jitsiApi && (
            <div className="absolute top-4 right-4 z-10">
              <Button
                onClick={leaveMeeting}
                variant="outline"
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700 border-red-600"
              >
                Leave Call
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Family Member</h3>
              <Button
                onClick={() => setShowInviteModal(false)}
                variant="ghost"
                size="sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Share this link with family members who need to join the consultation:
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm font-mono break-all">
              {appointment.videoConference?.relativesJoinUrl}
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button onClick={copyInviteLink} variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </Button>
              
              <Button onClick={shareViaWhatsApp} variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.688z"/>
                </svg>
                Share via WhatsApp
              </Button>
              
              <Button onClick={shareViaEmail} variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Share via Email
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
