'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { authService } from '@/lib/firebase/auth';
import { apiClient } from '@/lib/firebase/api';
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

      // If no role in claims, try to fetch from backend
      const response = await apiClient.get<{ role: UserRole }>('/roles/my-role');
      return response.role;
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

  const register = async (email: string, password: string, displayName?: string) => {
    await authService.register(email, password, displayName);
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