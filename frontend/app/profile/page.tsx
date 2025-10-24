import { ProfilePage } from '@/components/profile/ProfilePage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}