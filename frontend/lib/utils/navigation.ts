import { UserRole } from '@/types/auth';

/**
 * Get the appropriate dashboard URL based on user role
 */
export function getDashboardUrl(role?: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'doctor':
      return '/doctor-portal';
    case 'patient':
      return '/patient-portal';
    default:
      return '/dashboard';
  }
}

/**
 * Redirect to the appropriate dashboard based on user role
 */
export function redirectToDashboard(role?: UserRole): void {
  const url = getDashboardUrl(role);
  window.location.href = url;
}
