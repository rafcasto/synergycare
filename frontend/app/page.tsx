'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getDashboardUrl } from '@/lib/utils/navigation';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect to appropriate dashboard based on role
        const dashboardUrl = getDashboardUrl(user.role);
        router.push(dashboardUrl);
      } else {
        router.push('/role-selection');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <LoadingSpinner size="lg" />
    </div>
  );
}
