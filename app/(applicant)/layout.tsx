'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb, useBreadcrumbs } from '@/components/ui/breadcrumb';
import { useAuth } from '@/hooks/use-auth';

export default function ApplicantLayout({ children }: { children: ReactNode }) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const breadcrumbs = useBreadcrumbs();

  // Redirect to login if not authenticated or not applicant
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userRole !== 'applicant') {
        router.push('/dashboard');
      }
    }
  }, [user, userRole, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Breadcrumb items={breadcrumbs} />
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Job Portal</h1>
              {user && (
                <span className="ml-4 text-sm text-gray-600">
                  Welcome, {user.user_metadata?.full_name || user.email}
                </span>
              )}
            </div>
            {user && (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Logout
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
