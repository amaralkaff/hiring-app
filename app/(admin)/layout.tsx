'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb, useBreadcrumbs } from '@/components/ui/breadcrumb';
import { UserDropdown } from '@/components/ui/user-dropdown';
import { useAuth } from '@/hooks/use-auth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const breadcrumbs = useBreadcrumbs();

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (user && userRole === null) {
      // Still loading role, don't redirect yet
      return;
    }
    if (user && userRole !== 'admin') {
      router.push('/jobs');
    } else if (!user) {
      router.push('/login');
    }
  }, [user, userRole, router]);

  // Show loading state while user exists but role is still loading
  if (user && userRole === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show minimal loading only when no user exists
  if (!user) {
    return null; // Let middleware handle redirect
  }

  // If wrong role, let redirect happen
  if (userRole !== 'admin') {
    return null; // Let redirect happen
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Breadcrumb items={breadcrumbs} />
            </div>
            <UserDropdown user={user} userRole={userRole} />
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
