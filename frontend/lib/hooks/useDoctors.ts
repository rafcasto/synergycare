'use client';

import { useState, useEffect, useCallback } from 'react';
import { FirestoreService, DoctorPublicProfile } from '@/lib/firebase/firestore';

export interface UseDoctorsReturn {
  doctors: DoctorPublicProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  searchDoctors: (searchTerm: string) => Promise<DoctorPublicProfile[]>;
  getDoctorsBySpecialization: (specialization: string) => Promise<DoctorPublicProfile[]>;
}

export function useDoctors(limitCount = 20): UseDoctorsReturn {
  const [doctors, setDoctors] = useState<DoctorPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const doctorsList = await FirestoreService.getAllDoctors(limitCount);
      setDoctors(doctorsList);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  }, [limitCount]);

  const searchDoctors = async (searchTerm: string): Promise<DoctorPublicProfile[]> => {
    try {
      return await FirestoreService.searchDoctorsByName(searchTerm);
    } catch (err) {
      console.error('Error searching doctors:', err);
      throw err;
    }
  };

  const getDoctorsBySpecialization = async (specialization: string): Promise<DoctorPublicProfile[]> => {
    try {
      return await FirestoreService.getDoctorsBySpecialization(specialization);
    } catch (err) {
      console.error('Error fetching doctors by specialization:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return {
    doctors,
    loading,
    error,
    refetch: fetchDoctors,
    searchDoctors,
    getDoctorsBySpecialization,
  };
}
