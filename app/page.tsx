'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is a magic link confirmation (Supabase uses token_hash and type)
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (token_hash && type) {
      // Redirect magic link parameters to the confirmation route
      const params = new URLSearchParams();
      params.set('token_hash', token_hash);
      params.set('type', type);

      router.replace(`/auth/confirm?${params.toString()}`);
      return;
    }

    // Handle legacy code parameter (if Supabase sends it)
    const code = searchParams.get('code');
    if (code) {
      // Some systems might use code parameter, redirect to confirm to handle it
      router.replace(`/auth/confirm?code=${code}`);
      return;
    }

    // The middleware will handle the automatic redirect based on authentication status
    // If user is not authenticated, they'll be redirected to login
    // If user is authenticated, they'll be redirected to their appropriate dashboard
    // This page will only show for unauthenticated users briefly before redirect
    const timer = setTimeout(() => {
      router.push('/login');
    }, 1000); // Fallback redirect after 1 second

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="w-full max-w-4xl px-6 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-6"></div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <main className="w-full max-w-4xl px-6 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600">
              Loading...
            </p>
          </div>
        </main>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
