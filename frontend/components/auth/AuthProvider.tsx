'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { authService } from '@/lib/firebase/auth';
import { FirestoreService } from '@/lib/firebase/firestore';
import { User, AuthContextType, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (firebaseUser: FirebaseUser): Promise<UserRole | undefined> => {
    try {
      // First try to get role from custom claims
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const role = tokenResult.claims.role as UserRole;
      
      if (role) {
        return role;
      }

      // If no role in claims, try to get from Firestore
      try {
        const userProfile = await FirestoreService.getUser(firebaseUser.uid);
        if (userProfile?.role) {
          return userProfile.role;
        }
      } catch (firestoreError) {
        console.log('Could not fetch role from Firestore:', firestoreError);
      }

      // If no role found anywhere, return undefined (don't fail)
      return undefined;
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      return undefined;
    }
  };

  const refreshUserRole = async () => {
    if (auth.currentUser) {
      try {
        const role = await fetchUserRole(auth.currentUser);
        setUser(prev => prev ? { ...prev, role } : null);
      } catch (error) {
        console.error('Failed to refresh user role:', error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Get role from custom claims or backend
        const role = await fetchUserRole(firebaseUser);
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          role,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await authService.signIn(email, password);
  };

  const register = async (email: string, password: string, displayName?: string, role?: UserRole, additionalData?: Record<string, unknown>) => {
    const userCredential = await authService.register(email, password, displayName);
    
    // Store user data directly in Firestore (no backend needed for this)
    if (role && userCredential.user) {
      try {
        const baseUserData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: displayName || userCredential.user.displayName || '',
          role: role,
          ...(userCredential.user.photoURL && { photoURL: userCredential.user.photoURL }),
        };

        // Store user data directly in Firestore first (most important)
        if (role === 'doctor' && additionalData) {
          const doctorData = {
            ...baseUserData,
            role: 'doctor' as const,
            firstName: additionalData.firstName as string,
            lastName: additionalData.lastName as string,
            phoneNumber: additionalData.phoneNumber as string,
            medicalLicense: additionalData.medicalLicense as string,
            specialization: additionalData.specialization as string,
          };
          
          // Only add hospitalAffiliation if it's provided
          if (additionalData.hospitalAffiliation) {
            (doctorData as typeof doctorData & { hospitalAffiliation: string }).hospitalAffiliation = additionalData.hospitalAffiliation as string;
          }
          
          await FirestoreService.createDoctorProfile(doctorData);
          console.log('Doctor profile stored in Firestore');
        } else if (role === 'patient' && additionalData) {
          const patientData = {
            ...baseUserData,
            role: 'patient' as const,
            firstName: additionalData.firstName as string,
            lastName: additionalData.lastName as string,
            dateOfBirth: additionalData.dateOfBirth as string,
            phoneNumber: additionalData.phoneNumber as string,
            address: additionalData.address as string,
            emergencyContact: additionalData.emergencyContact as string,
          };
          
          // Only add optional fields if they're provided
          if (additionalData.insuranceProvider) {
            (patientData as typeof patientData & { insuranceProvider: string }).insuranceProvider = additionalData.insuranceProvider as string;
          }
          if (additionalData.insuranceNumber) {
            (patientData as typeof patientData & { insuranceNumber: string }).insuranceNumber = additionalData.insuranceNumber as string;
          }
          
          await FirestoreService.createPatientProfile(patientData);
          console.log('Patient profile stored in Firestore');
        } else {
          await FirestoreService.createUser(baseUserData);
          console.log('Basic user profile stored in Firestore');
        }
        
        // Try to set role via backend (for custom claims) - IMPORTANT for security
        try {
          const idToken = await userCredential.user.getIdToken();
          const response = await fetch('/api/proxy/user/complete-registration', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              role,
              user_data: additionalData || {},
            }),
          });
          
          if (response.ok) {
            console.log('✅ Backend role setting completed - user now has custom claims');
            // Force token refresh to get new custom claims
            await userCredential.user.getIdToken(true);
          } else {
            console.warn('⚠️ Backend role setting failed, but Firestore data is saved');
          }
        } catch (backendError) {
          console.warn('⚠️ Backend not available for role setting:', backendError);
          console.log('✅ User data is safely stored in Firestore');
        }
        
      } catch (error) {
        console.error('Failed to store user data in Firestore:', error);
        throw error; // This is important - if Firestore fails, we should know
      }
    }
  };

  const logout = async () => {
    await authService.signOut();
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}