'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb, useBreadcrumbs } from '@/components/ui/breadcrumb';
import { UserDropdown } from '@/components/ui/user-dropdown';
import { useAuth } from '@/hooks/use-auth';

export default function ApplicantLayout({ children }: { children: ReactNode }) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const breadcrumbs = useBreadcrumbs();

  // Redirect if not authenticated or wrong role - only after loading is complete
  useEffect(() => {
    if (isLoading) {
      return; // Don't do anything while loading
    }

    if (user && userRole !== 'applicant') {
      router.push('/dashboard');
    } else if (!user) {
      router.push('/login');
    }
  }, [user, userRole, isLoading, router]);


  // Show minimal loading only when no user exists
  if (!user) {
    return null; // Let middleware handle redirect
  }

  // If wrong role, let redirect happen
  if (userRole !== 'applicant') {
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
