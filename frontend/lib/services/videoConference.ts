'use client';

import { nanoid } from 'nanoid';

export interface JitsiConfig {
  domain: string;
  roomName: string;
  displayName: string;
  email?: string;
  userRole?: 'doctor' | 'patient' | 'relative';
  width?: string | number;
  height?: string | number;
  parentNode?: HTMLElement;
  configOverwrite?: {
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    disableModeratorIndicator?: boolean;
    startScreenSharing?: boolean;
    enableEmailInStats?: boolean;
    enableWelcomePage?: boolean;
    prejoinPageEnabled?: boolean;
    toolbarButtons?: string[];
  };
  interfaceConfigOverwrite?: {
    DISABLE_JOIN_LEAVE_NOTIFICATIONS?: boolean;
    DISABLE_PRESENCE_STATUS?: boolean;
    SHOW_JITSI_WATERMARK?: boolean;
    SHOW_WATERMARK_FOR_GUESTS?: boolean;
    TOOLBAR_BUTTONS?: string[];
  };
}

export interface VideoConferenceRoom {
  roomName: string;
  joinUrl: string;
  patientJoinUrl: string;
  relativesJoinUrl: string;
  isActive: boolean;
}

interface JitsiMeetExternalAPI {
  new (domain: string, options: unknown): unknown;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiMeetExternalAPI;
  }
}

export class VideoConferenceService {
  private static readonly JITSI_DOMAIN = 'meet.jit.si';
  private static readonly SCRIPT_ID = 'jitsi-external-api';

  /**
   * Load Jitsi Meet External API script
   */
  static async loadJitsiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      // Check if script is already being loaded
      if (document.getElementById(this.SCRIPT_ID)) {
        // Wait for the script to load
        const checkLoaded = () => {
          if (window.JitsiMeetExternalAPI) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      const script = document.createElement('script');
      script.id = this.SCRIPT_ID;
      script.src = `https://${this.JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
      document.head.appendChild(script);
    });
  }

  /**
   * Generate a unique, secure room name for an appointment
   */
  static generateRoomName(appointmentId: string): string {
    const timestamp = Date.now().toString(36);
    const randomId = nanoid(8);
    // Create a secure, unique room name
    return `telehealth-${appointmentId.slice(-6)}-${timestamp}-${randomId}`;
  }

  /**
   * Create video conference room data for an appointment
   */
  static createVideoConferenceRoom(
    appointmentId: string
  ): VideoConferenceRoom {
    const roomName = this.generateRoomName(appointmentId);
    const baseUrl = `https://${this.JITSI_DOMAIN}/${roomName}`;
    
    return {
      roomName,
      joinUrl: baseUrl,
      patientJoinUrl: `${baseUrl}?userInfo.displayName=Patient&userInfo.role=patient`,
      relativesJoinUrl: `${baseUrl}?userInfo.displayName=Family%20Member&userInfo.role=relative`,
      isActive: false
    };
  }

  /**
   * Create and configure Jitsi Meet API instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createJitsiMeeting(config: JitsiConfig): Promise<any> {
    await this.loadJitsiScript();

    if (!window.JitsiMeetExternalAPI) {
      throw new Error('Jitsi Meet API not available');
    }

    const defaultConfig: Partial<JitsiConfig> = {
      domain: this.JITSI_DOMAIN,
      width: '100%',
      height: '100%',
      configOverwrite: {
        startWithAudioMuted: config.userRole !== 'doctor', // Doctor starts unmuted
        startWithVideoMuted: false,
        disableModeratorIndicator: false,
        enableEmailInStats: false,
        enableWelcomePage: false,
        prejoinPageEnabled: true,
        toolbarButtons: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting',
          'fullscreen', 'fodeviceselection', 'hangup', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'select-background', 'download', 'help', 'mute-everyone',
          'security'
        ]
      },
      interfaceConfigOverwrite: {
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
        DISABLE_PRESENCE_STATUS: false,
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'chat', 'recording', 'livestreaming',
          'etherpad', 'sharedvideo', 'settings', 'raisehand', 'videoquality',
          'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts', 'tileview',
          'select-background', 'download', 'help', 'mute-everyone'
        ]
      }
    };

    const mergedConfig = { ...defaultConfig, ...config };

    // Create user info object
    const userInfo: Record<string, unknown> = {
      displayName: mergedConfig.displayName
    };

    if (mergedConfig.email) {
      userInfo.email = mergedConfig.email;
    }

    const options = {
      roomName: mergedConfig.roomName,
      width: mergedConfig.width,
      height: mergedConfig.height,
      parentNode: mergedConfig.parentNode,
      configOverwrite: mergedConfig.configOverwrite,
      interfaceConfigOverwrite: mergedConfig.interfaceConfigOverwrite,
      userInfo
    };

    return new window.JitsiMeetExternalAPI(mergedConfig.domain, options);
  }

  /**
   * Generate sharing URLs for relatives
   */
  static generateRelativeInviteData(room: VideoConferenceRoom, patientName: string, doctorName: string) {
    const appointmentInfo = `Join ${patientName}'s telehealth appointment with ${doctorName}`;
    
    return {
      shareUrl: room.relativesJoinUrl,
      shareText: `${appointmentInfo}\n\nJoin the video call: ${room.relativesJoinUrl}\n\nThis is a secure medical consultation. Please ensure privacy and quiet environment.`,
      emailSubject: `Telehealth Appointment Invitation - ${patientName}`,
      emailBody: `Dear Family Member,\n\nYou have been invited to join ${patientName}'s telehealth appointment with ${doctorName}.\n\nClick the link below to join the secure video consultation:\n${room.relativesJoinUrl}\n\nPlease ensure you:\n- Join from a quiet, private location\n- Test your camera and microphone beforehand\n- Have a stable internet connection\n\nBest regards,\nSynergyCare Team`,
      smsText: `Join ${patientName}'s telehealth appointment: ${room.relativesJoinUrl}`
    };
  }

  /**
   * Validate if a room name is valid
   */
  static isValidRoomName(roomName: string): boolean {
    return /^telehealth-[a-zA-Z0-9\-_]{10,}$/.test(roomName);
  }

  /**
   * Clean up Jitsi instance
   */
  static cleanupJitsiInstance(api: unknown): void {
    if (api && typeof (api as { dispose?: () => void }).dispose === 'function') {
      (api as { dispose: () => void }).dispose();
    }
  }

  /**
   * Get recommended browser for best experience
   */
  static getBrowserRecommendation(): { isRecommended: boolean; message?: string } {
    const userAgent = navigator.userAgent;
    
    // Check for recommended browsers
    if (userAgent.includes('Chrome') || userAgent.includes('Firefox') || userAgent.includes('Safari')) {
      return { isRecommended: true };
    }
    
    return {
      isRecommended: false,
      message: 'For the best video call experience, we recommend using Chrome, Firefox, or Safari.'
    };
  }

  /**
   * Check device capabilities
   */
  static async checkDeviceCapabilities(): Promise<{
    hasCamera: boolean;
    hasMicrophone: boolean;
    hasWebRTC: boolean;
  }> {
    const hasWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    if (!hasWebRTC) {
      return { hasCamera: false, hasMicrophone: false, hasWebRTC: false };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');
      
      return { hasCamera, hasMicrophone, hasWebRTC: true };
    } catch (error) {
      console.warn('Could not enumerate devices:', error);
      return { hasCamera: false, hasMicrophone: false, hasWebRTC: true };
    }
  }
}
