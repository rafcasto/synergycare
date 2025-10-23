'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import { UserRole } from '@/types/auth';

interface RoleGuardProps {
  allowedRoles: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return fallback as React.ReactElement;
  }

  const userRole = user.role;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!userRole || !roles.includes(userRole)) {
    return fallback as React.ReactElement;
  }

  return <>{children}</>;
}

interface RoleBasedComponentProps {
  children: React.ReactNode;
}

export function AdminOnly({ children }: RoleBasedComponentProps) {
  return (
    <RoleGuard 
      allowedRoles="admin"
      fallback={
        <div className="text-red-600 p-4 text-center">
          Access denied. Admin privileges required.
        </div>
      }
    >
      {children}
    </RoleGuard>
  );
}

export function DoctorOnly({ children }: RoleBasedComponentProps) {
  return (
    <RoleGuard 
      allowedRoles="doctor"
      fallback={
        <div className="text-red-600 p-4 text-center">
          Access denied. Doctor privileges required.
        </div>
      }
    >
      {children}
    </RoleGuard>
  );
}

export function PatientOnly({ children }: RoleBasedComponentProps) {
  return (
    <RoleGuard 
      allowedRoles="patient"
      fallback={
        <div className="text-red-600 p-4 text-center">
          Access denied. Patient privileges required.
        </div>
      }
    >
      {children}
    </RoleGuard>
  );
}

export function DoctorOrAdmin({ children }: RoleBasedComponentProps) {
  return (
    <RoleGuard 
      allowedRoles={['doctor', 'admin']}
      fallback={
        <div className="text-red-600 p-4 text-center">
          Access denied. Doctor or Admin privileges required.
        </div>
      }
    >
      {children}
    </RoleGuard>
  );
}

export function PatientOrDoctor({ children }: RoleBasedComponentProps) {
  return (
    <RoleGuard 
      allowedRoles={['patient', 'doctor']}
      fallback={
        <div className="text-red-600 p-4 text-center">
          Access denied. Patient or Doctor privileges required.
        </div>
      }
    >
      {children}
    </RoleGuard>
  );
}
