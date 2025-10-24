'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { FirestoreService, DoctorProfile, PatientProfile, BaseUser } from '@/lib/firebase/firestore';

export interface UseUserProfileReturn {
  profile: DoctorProfile | PatientProfile | BaseUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<DoctorProfile | PatientProfile | BaseUser>) => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | PatientProfile | BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let userProfile: DoctorProfile | PatientProfile | BaseUser | null = null;

      // Try to get role-specific profile first
      if (user.role === 'doctor') {
        userProfile = await FirestoreService.getDoctorProfile(user.uid);
      } else if (user.role === 'patient') {
        userProfile = await FirestoreService.getPatientProfile(user.uid);
      }
      
      // Fallback to basic user profile if role-specific profile not found
      if (!userProfile) {
        userProfile = await FirestoreService.getUser(user.uid);
      }

      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.role]);

  const updateProfile = async (updates: Partial<DoctorProfile | PatientProfile | BaseUser>) => {
    if (!user?.uid) throw new Error('No user logged in');

    try {
      if (user.role === 'doctor') {
        await FirestoreService.updateDoctorProfile(user.uid, updates as Partial<DoctorProfile>);
      } else if (user.role === 'patient') {
        await FirestoreService.updatePatientProfile(user.uid, updates as Partial<PatientProfile>);
      } else {
        await FirestoreService.updateUser(user.uid, updates as Partial<BaseUser>);
      }
      
      // Refetch profile after update
      await fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}

// Hook specifically for doctor profiles
export function useDoctorProfile(doctorId?: string): UseUserProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetId = doctorId || user?.uid;

  const fetchProfile = useCallback(async () => {
    if (!targetId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const doctorProfile = await FirestoreService.getDoctorProfile(targetId);
      setProfile(doctorProfile);
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch doctor profile');
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  const updateProfile = async (updates: Partial<DoctorProfile | PatientProfile | BaseUser>) => {
    if (!targetId) throw new Error('No doctor ID provided');

    try {
      await FirestoreService.updateDoctorProfile(targetId, updates as Partial<DoctorProfile>);
      await fetchProfile();
    } catch (err) {
      console.error('Error updating doctor profile:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}

// Hook specifically for patient profiles
export function usePatientProfile(patientId?: string): UseUserProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetId = patientId || user?.uid;

  const fetchProfile = useCallback(async () => {
    if (!targetId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const patientProfile = await FirestoreService.getPatientProfile(targetId);
      setProfile(patientProfile);
    } catch (err) {
      console.error('Error fetching patient profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch patient profile');
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  const updateProfile = async (updates: Partial<DoctorProfile | PatientProfile | BaseUser>) => {
    if (!targetId) throw new Error('No patient ID provided');

    try {
      await FirestoreService.updatePatientProfile(targetId, updates as Partial<PatientProfile>);
      await fetchProfile();
    } catch (err) {
      console.error('Error updating patient profile:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}
