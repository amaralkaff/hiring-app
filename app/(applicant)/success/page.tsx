'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/jobs');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="text-center">
        {/* Success Image */}
        <div className="mb-6">
          <Image
            src="/ilustrate-success.png"
            alt="Application Submitted Successfully"
            width={256}
            height={256}
            className="w-64 h-64 mx-auto object-contain"
          />
        </div>

        {/* Success Message */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Application Submitted Successfully!
        </h2>
        <p className="text-gray-600 mb-6">
          Thank you for applying. We&apos;ll review your application and get back to you soon.
        </p>
        <p className="text-sm text-gray-500">Redirecting to job listings...</p>
      </div>
    </div>
  );
}