import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
