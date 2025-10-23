// UI components
export { Button } from './ui/Button';
export { Card } from './ui/Card';
export { Input } from './ui/Input';
export { LoadingSpinner } from './ui/LoadingSpinner';

// Auth components
export { AuthProvider, useAuth } from './auth/AuthProvider';
export { LoginForm } from './auth/LoginForm';
export { SignupForm } from './auth/SignupForm';
export { ProtectedRoute } from './auth/ProtectedRoute';
export { 
  RoleGuard, 
  AdminOnly, 
  DoctorOnly, 
  PatientOnly, 
  DoctorOrAdmin, 
  PatientOrDoctor 
} from './auth/RoleGuard';

// Layout components
export { Header } from './layout/Header';
export { Navigation } from './layout/Navigation';