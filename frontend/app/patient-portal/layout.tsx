import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function PatientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
