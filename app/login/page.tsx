'use client';

import { useState, Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { login, signInWithGoogle } from '@/app/auth/actions';
import { cn } from '@/lib/utils';
import { KeyIcon } from '@heroicons/react/24/outline';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const [authError, setAuthError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [emailValidationError, setEmailValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const error = searchParams.get('error');

  const [loginMethod, setLoginMethod] = useState<'magic' | 'password'>('magic');

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Watch email field for real-time validation
  const emailValue = form.watch('email');

  // Real-time email validation
  useEffect(() => {
    if (emailValue && emailValue.length > 0) {
      const validationResult = loginSchema.safeParse({ email: emailValue, password: '' });
      if (!validationResult.success && validationResult.error.issues.some(issue => issue.path.includes('email'))) {
        const emailError = validationResult.error.issues.find(issue => issue.path.includes('email'))?.message;
        setEmailValidationError(emailError || 'Email tidak valid');
      } else {
        setEmailValidationError('');
      }
    } else {
      setEmailValidationError('');
    }
  }, [emailValue]);

  const onLoginSubmit = async (data: LoginFormData) => {
    setAuthError('');
    setSuccessMessage('');
    setIsPending(true);

    try {
      const formData = new FormData();
      formData.set('email', data.email);
      formData.set('method', loginMethod);

      if (loginMethod === 'password') {
        formData.set('password', data.password || '');
      }

      const result = await login(formData);
      if (result?.error) {
        setAuthError(result.error);
      } else if (result?.success) {
        // Store email in localStorage and redirect to magic link sent page
        setAuthError('');
        if (loginMethod === 'magic') {
          localStorage.setItem('pendingEmail', data.email);
          window.location.href = '/auth/magic-link-sent?email=' + encodeURIComponent(data.email);
        }
        // The user will be redirected after clicking the magic link
      } else {
        // Password authentication successful - server will handle redirect
        // No action needed here as the server action will redirect
        setAuthError('');
        setSuccessMessage('Login berhasil! Mengalihkan...');
      }
    } catch (error) {
      // Handle Next.js redirect errors - these are expected and not actual errors
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        // This is the expected redirect, don't treat it as an error
        throw error; // Re-throw to let Next.js handle the redirect
      }

      // Set error for actual login failures
      setAuthError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      // Always reset isPending - the server will handle redirect if successful
      setIsPending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setIsGooglePending(true);

    try {
      const result = await signInWithGoogle();
      if (result?.error) {
        setAuthError(result.error);
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
          <img
            src="https://khzrfwyofxqrqvelydkn.supabase.co/storage/v1/object/public/logo/255145972b7aff74a83fec16f9c08eda3afe6ae3.png"
            alt="Company Logo"
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
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {successMessage}
                </p>
              </div>
            )}

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 text-center">
                  {authError}
                </p>
              </div>
            )}

            {error && !authError && (
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

            {emailValidationError && loginMethod === 'magic' && !successMessage && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-600 text-center">
                  <strong>Perhatian:</strong> {emailValidationError}. Harap perbaiki format email sebelum mengirim tautan ajaib.
                </p>
              </div>
            )}
          </div>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Alamat email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder=""
                        className={cn(
                          "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                          form.formState.errors.email
                            ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus placeholder:text-neutral-60"
                            : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-600" />
                  </FormItem>
                )}
              />

              {/* Password Field (shown when password login is selected) */}
              {loginMethod === 'password' && (
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Kata Sandi
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            placeholder=""
                            className={cn(
                              "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                              form.formState.errors.password
                                ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus placeholder:text-neutral-60"
                                : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-sm text-red-600" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

                <Button
                  type="submit"
                  disabled={isPending || (loginMethod === 'magic' && !!emailValidationError)}
                  className="w-full h-12 bg-[#F5A623] hover:bg-[#E09612] text-white font-black rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {loginMethod === 'magic' ? 'Mengirim...' : 'Masuk...'}
                    </span>
                  ) : (
                    loginMethod === 'magic' ? 'Daftar dengan email' : 'Masuk'
                  )}
                </Button>
            </form>
          </Form>


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
            className="w-full h-12 border-2 border-gray-300 flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm hover:text-gray-900 font-black rounded-md transition-all"
          >
            {isGooglePending ? (
              <span className="flex items-center justify-center font-black">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Masuk dengan Google...
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