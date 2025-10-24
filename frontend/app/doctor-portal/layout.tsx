import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DoctorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
