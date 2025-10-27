'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import * as z from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, signInWithGoogle } from '@/app/auth/actions';
import { KeyIcon } from '@heroicons/react/24/outline';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().optional(),
});

function LoginPageContent() {
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [emailValidationError, setEmailValidationError] = useState('');
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const [loginMethod, setLoginMethod] = useState<'magic' | 'password'>('magic');

  // Use useActionState for form handling
  const [state, formAction, isPending] = useActionState(login, {
    error: '',
    success: false
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Real-time email validation
  useEffect(() => {
    if (email && email.length > 0) {
      const validationResult = loginSchema.safeParse({ email, password: '' });
      if (!validationResult.success && validationResult.error.issues.some(issue => issue.path.includes('email'))) {
        const emailError = validationResult.error.issues.find(issue => issue.path.includes('email'))?.message;
        setEmailValidationError(emailError || 'Email tidak valid');
      } else {
        setEmailValidationError('');
      }
    } else {
      setEmailValidationError('');
    }
  }, [email]);

  // Handle auto-refresh for successful login
  useEffect(() => {
    if (state.success && state.redirectTo) {
      // Auto-refresh to redirect to the correct page
      window.location.href = state.redirectTo;
    }
  }, [state.success, state.redirectTo]);

  // Handle magic link redirect for successful magic link login
  useEffect(() => {
    if (state.success && state.message && loginMethod === 'magic') {
      // Store email in localStorage and redirect to magic link sent page
      localStorage.setItem('pendingEmail', email);
      window.location.href = '/auth/magic-link-sent?email=' + encodeURIComponent(email);
    }
  }, [state.success, state.message, loginMethod, email]);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (result?.error) {
        // The error will be shown in the form state
      }
    } finally {
      setIsGooglePending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-4">

        {/* Logo */}
        <div className="flex justify-start">
          <Image
            src="https://khzrfwyofxqrqvelydkn.supabase.co/storage/v1/object/public/logo/255145972b7aff74a83fec16f9c08eda3afe6ae3.png"
            alt="Company Logo"
            width={144}
            height={144}
            className="relative h-36 w-auto top-12"
          />
        </div>

        {/* White Card Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {loginMethod === 'magic' ? 'Bergabung dengan Rakamin' : 'Masuk dengan Password'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Belum punya akun?{' '}
              <Link href="/register" className="text-[#01959F] font-medium hover:underline">
                Daftar dengan menggunakan email
              </Link>
            </p>
            {state.message && state.success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {state.message}
                </p>
              </div>
            )}

            {state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 text-center">
                  {state.error}
                </p>
              </div>
            )}

            {error && !state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 text-center">
                  {(() => {
                    switch(error) {
                      case 'confirmation_failed':
                        return 'Email ini sudah terdaftar sebagai akun di Rakamin. Silakan masuk.';
                      case 'confirmation_link_expired':
                        return 'Tautan konfirmasi Anda telah kedaluwarsa. Silakan daftar lagi untuk menerima email konfirmasi baru.';
                      default:
                        return 'Autentikasi gagal. Silakan coba lagi.';
                    }
                  })()}
                </p>
                {error === 'confirmation_link_expired' && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    Silakan periksa email Anda atau daftar lagi untuk menerima tautan konfirmasi baru.
                  </p>
                )}
              </div>
            )}

            {emailValidationError && loginMethod === 'magic' && !state.success && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-600 text-center">
                  <strong>Perhatian:</strong> {emailValidationError}. Harap perbaiki format email sebelum mengirim tautan ajaib.
                </p>
              </div>
            )}
          </div>

          {/* Login Form */}
          <form action={formAction} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="email">
                Alamat email
              </label>
              <Input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none border-neutral-40 bg-neutral-10 hover:border-primary-hover focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60 mt-2"
                required
              />
            </div>

            {/* Password Field (shown when password login is selected) */}
            {loginMethod === 'password' && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700" htmlFor="password">
                  Kata Sandi
                </label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none border-neutral-40 bg-neutral-10 hover:border-primary-hover focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60 mt-2"
                  required={loginMethod === 'password'}
                />
              </div>
            )}

            {/* Hidden field for login method */}
            <input type="hidden" name="method" value={loginMethod} />

            <Button
              type="submit"
              disabled={isPending || (loginMethod === 'magic' && !!emailValidationError)}
              className="w-full h-12 bg-[#F5A623] hover:bg-[#E09612] text-white font-black rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {isPending ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  <span className="animate-pulse">{loginMethod === 'magic' ? 'Mengirim...' : 'Masuk...'}</span>
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  {loginMethod === 'magic' ? 'Daftar dengan email' : 'Masuk'}
                </span>
              )}
            </Button>
          </form>


          {/* Divider */}
          <div className="my-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">or</span>
              </div>
            </div>
          </div>
  
        {/* Password Login Option */}
          <Button
            type="button"
            onClick={() => setLoginMethod(loginMethod === 'password' ? 'magic' : 'password')}
            variant="outline"
            className="w-full h-12 border-2 border-gray-300 flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm hover:text-gray-900 font-black rounded-md transition-all mb-2"
          >
            <KeyIcon className="w-5 h-5" />
            {loginMethod === 'password' ? 'Gunakan Magic Link' : 'Masuk dengan Password'}
          </Button>

          {/* Google Sign In */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGooglePending}
            variant="outline"
            className="w-full h-12 border-2 border-gray-300 flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm hover:text-gray-900 font-black rounded-md transition-all relative"
          >
            {isGooglePending ? (
              <span className="flex items-center justify-center font-black">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent mr-3"></div>
                <span className="animate-pulse">Masuk dengan Google...</span>
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Daftar dengan Google
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}