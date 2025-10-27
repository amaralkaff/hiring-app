'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchParams } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { register, signInWithGoogle, login } from '@/app/auth/actions';
import  {KeyIcon}  from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  email: z.string()
    .min(1, 'Email diperlukan')
    .email('Alamat email tidak valid')
    .refine((email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return false;
      if (email.includes('..')) return false;
      const domain = email.split('@')[1];
      if (!domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return false;
      return true;
    }, 'Alamat email tidak valid'),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password || data.confirmPassword) {
    return (data.password?.length ?? 0) >= 8 && data.password === data.confirmPassword;
  }
  return true;
}, {
  message: 'Password minimal 8 karakter dan harus sama',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [method, setMethod] = useState<'magic' | 'password'>('magic');
  const [authError, setAuthError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [emailValidationError, setEmailValidationError] = useState('');
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Watch email field for real-time validation
  const emailValue = form.watch('email');

  // Real-time email validation + existence check (debounced)
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (emailValue && emailValue.length > 0) {
        const validationResult = registerSchema.safeParse({ email: emailValue });
        if (!validationResult.success && validationResult.error.issues.some(issue => issue.path.includes('email'))) {
          const emailError = validationResult.error.issues.find(issue => issue.path.includes('email'))?.message;
          if (!active) return;
          setEmailValidationError(emailError || 'Email tidak valid');
          setEmailExists(null);
          return;
        } else {
          if (!active) return;
          setEmailValidationError('');
        }

        // Debounce 400ms before checking
        await new Promise(r => setTimeout(r, 400));
        if (!active) return;

        try {
          const res = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailValue })
          });
          const json = await res.json();
          if (!active) return;
          setEmailExists(!!json.exists);
        } catch {
          if (!active) return;
          setEmailExists(null);
        }
      } else {
        if (!active) return;
        setEmailValidationError('');
        setEmailExists(null);
      }
    };

    run();
    return () => { active = false };
  }, [emailValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setAuthError('');
    setSuccessMessage('');
    setIsPending(true);

    try {
      const formData = new FormData();
      formData.set('email', data.email);

      if (emailExists) {
        // Existing user: show password login, or offer magic-link
        // We'll perform password login here for primary CTA
        formData.set('method', 'password');
        formData.set('password', data.password || '');
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password })
        })
        const json = await resp.json();
        if (!resp.ok || json.error) {
          setAuthError(json.error || 'Email atau password salah');
          return;
        }
        // Successful login will be completed by Supabase cookie session; navigate appropriately
        window.location.href = '/jobs';
        return;
      }

      // New user: use chosen method (magic or password)
      formData.set('method', method);
      if (method === 'password') {
        formData.set('password', data.password || '');
      }
      const result = await register(formData);

      if (result?.error) {
        setAuthError(result.error);
        if (result.errorCode === 'EMAIL_ALREADY_REGISTERED') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        }
      } else if (result?.success) {
        localStorage.setItem('pendingEmail', data.email);
        window.location.href = '/auth/magic-link-sent?email=' + encodeURIComponent(data.email);
      }
    } finally {
      setIsPending(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrablack text-gray-900">
              Periksa Email Anda
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Kami telah mengirimkan tautan konfirmasi ke:
            </p>
            <p className="mt-1 font-mono text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded">
              {registeredEmail}
            </p>
            <p className="mt-4 text-sm text-gray-600">
              Klik tautan dalam email untuk menyelesaikan pendaftaran Anda. Tautan akan kedaluwarsa dalam 30 menit.
            </p>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowConfirmation(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Kembali ke pendaftaran
            </button>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Tidak menerima email?</strong> Periksa folder spam Anda atau
              <button
                onClick={() => onSubmit(form.getValues())}
                className="text-blue-600 hover:text-blue-800 underline ml-1"
                disabled={isPending}
              >
                kirim ulang email
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

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
             {emailExists ? 'Email sudah terdaftar' : 'Bergabung dengan Rakamin'}
           </h2>
           <p className="text-sm text-gray-600 mb-6">
             {emailExists ? (
               <>
                 Kami menemukan akun dengan email tersebut. Anda dapat masuk dengan password atau meminta magic link.
               </>
             ) : (
               <>
                 Sudah punya akun?{' '}
                 <Link href="/login" className="text-[#01959F] hover:text-[#017a84] font-medium">
                   Masuk
                 </Link>
               </>
             )}
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
                <p className="text-sm text-red-600">{authError}</p>
                {authError.includes('sudah terdaftar') && (
                  <p className="text-xs text-red-500 mt-2">
                    Anda akan diarahkan ke halaman login dalam 3 detik...
                  </p>
                )}
              </div>
            )}
            {emailValidationError && !successMessage && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-600 text-center">
                  <strong>Perhatian:</strong> {emailValidationError}. Harap perbaiki format email sebelum mengirim tautan ajaib.
                </p>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              {(emailExists || method === 'password') && (
                <>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="password-field"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Minimal 8 karakter"
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

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Konfirmasi Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="Ulangi password"
                            className={cn(
                              "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                              form.formState.errors.confirmPassword
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
                </>
              )}

                <Button
                  type="submit"
                  disabled={isPending || !!emailValidationError || ((emailExists || method === 'password') && (!form.watch('password') || form.watch('password') !== form.watch('confirmPassword')))}
                  className="w-full h-12 bg-[#F5A623] hover:bg-[#E09612] text-white font-black rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center">
                      {emailExists ? 'Masuk...' : (method === 'magic' ? 'Mengirim...' : 'Mendaftar...')}
                    </span>
                  ) : (
                    emailExists ? 'Masuk' : (method === 'magic' ? 'Daftar dengan email' : 'Daftar dengan password')
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

      {/* Password Registration Option */}
          {!emailExists && (
            <Button
              type="button"
              onClick={() => setMethod(method === 'password' ? 'magic' : 'password')}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm hover:text-gray-900 font-black rounded-md transition-all mb-2"
            >
              <KeyIcon className="w-5 h-5" />
              {method === 'password' ? 'Gunakan Magic Link' : 'Daftar dengan Password'}
            </Button>
          )}

          {/* Google Sign In */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={!!isGooglePending}
            variant="outline"
            className="w-full h-12 border-2 border-gray-300 flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm hover:text-gray-900 font-black rounded-md transition-all"
          >
              {isGooglePending ? (
                <span className="flex items-center justify-center">
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