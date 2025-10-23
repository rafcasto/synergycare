// UI components
export { Button } from './ui/Button';
export { Card } from './ui/Card';
export { Input } from './ui/Input';
export { LoadingSpinner } from './ui/LoadingSpinner';
export { Alert, AlertTitle, AlertDescription } from './ui/Alert';

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

// Admin components
export { MetricCard } from './admin/MetricCard';
export { SimpleChart } from './admin/SimpleChart';
export { DashboardSkeleton } from './admin/DashboardSkeleton';