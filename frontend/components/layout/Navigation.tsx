'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@/types/auth';

interface NavItem {
  href: string;
  label: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/profile', label: 'Profile' },
  { href: '/appointments', label: 'Appointments', roles: ['patient', 'doctor'] },
  { href: '/medical-records', label: 'Medical Records', roles: ['patient', 'doctor'] },
  { href: '/patients', label: 'My Patients', roles: ['doctor'] },
  { href: '/doctors', label: 'Find Doctors', roles: ['patient'] },
  { href: '/admin', label: 'Admin', roles: ['admin'] },
];

export function Navigation() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return user.role && item.roles.includes(user.role);
  });

  return (
    <nav className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                pathname === item.href
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}