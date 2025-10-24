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
export { RoleSelectionForm } from './auth/RoleSelectionForm';
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

// Doctor components
export { DoctorLayout } from './doctor/DoctorLayout';
export { default as DoctorDashboard } from './doctor/DoctorDashboard';
export { default as ScheduleManager } from './doctor/ScheduleManager';
export { WeeklyScheduleEditor } from './doctor/WeeklyScheduleEditor';
export { CalendarView } from './doctor/CalendarView';
export { ExceptionManager } from './doctor/ExceptionManager';

// Patient components
export { PatientLayout } from './patient/PatientLayout';
export { default as PatientDashboard } from './patient/PatientDashboard';
export { default as AppointmentBooking } from './patient/AppointmentBooking';
export { default as DoctorSearch } from './patient/DoctorSearch';
export { default as DoctorProfile } from './patient/DoctorProfile';
export { default as BookingForm } from './patient/BookingForm';
export { default as BookingConfirmation } from './patient/BookingConfirmation';
export { default as PatientAppointments } from './patient/PatientAppointments';