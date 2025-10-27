'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function MagicLinkSentPage() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from localStorage or URL params
    const storedEmail = localStorage.getItem('pendingEmail');
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const emailParam = urlParams.get('email');

    const setEmailFromSource = (emailSource: string | null) => {
      if (emailSource) {
        setEmail(emailSource);
      }
    };

    if (emailParam) {
      setEmailFromSource(emailParam);
    } else if (storedEmail) {
      setEmailFromSource(storedEmail);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
            Periksa Email Anda
          </h1>

          <p className="text-center text-lg text-gray-600 mb-4">
            Kami sudah mengirimkan link login ke <span className="font-semibold">{email || 'example@example.com'}</span> yang berlaku dalam 30 menit
          </p>

          {/* Illustration */}
          <div className="my-8 flex justify-center">
            <Image
              src="/magic-link-succes.png"
              alt="Magic link sent illustration"
              width={320}
              height={240}
              className="w-74 max-w-sm h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}