'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { signup, signInWithGoogle } from '@/app/auth/actions';
import { cn } from '@/lib/utils';

const signupSchema = z.object({
  email: z.string()
    .min(1, 'Email diperlukan')
    .email('Alamat email tidak valid')
    .refine((email) => {
      // Basic email validation to catch common issues
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return false;

      // Check for common invalid patterns like double dots
      if (email.includes('..')) return false;

      // Check if domain has valid format
      const domain = email.split('@')[1];
      if (!domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return false;

      return true;
    }, 'Alamat email tidak valid'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [authError, setAuthError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isGooglePending, setIsGooglePending] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setAuthError('');
    setIsPending(true);

    try {
      const formData = new FormData();
      formData.set('email', data.email);

      const result = await signup(formData);

      if (result?.error) {
        setAuthError(result.error);
        // If email already registered, show a helpful message
        if (result.errorCode === 'EMAIL_ALREADY_REGISTERED') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        }
      } else if (result?.success) {
        setRegisteredEmail(data.email);
        setShowConfirmation(true);
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
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Bergabung dengan Rakamin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Daftar untuk melamar pekerjaan
          </p>
          {authError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{authError}</p>
              {authError.includes('sudah terdaftar') && (
                <p className="text-xs text-red-500 mt-2">
                  Anda akan diarahkan ke halaman login dalam 3 detik...
                </p>
              )}
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-s-regular text-neutral-100">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="nama@email.com"
                      className={cn(
                        "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                        form.formState.errors.email
                          ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                          : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-s-regular text-danger-main" />
                </FormItem>
              )}
            />

            
            <div className="pt-6">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 bg-[#01959F] hover:bg-[#017a84] text-white font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengirim...
                  </span>
                ) : (
                  'Kirim Tautan Ajaib'
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Google Sign In */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">atau</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleGoogleSignIn} className="mt-6">
          <Button
            type="submit"
            disabled={isGooglePending}
            variant="outline"
            className="w-full h-10 border-2 flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-all"
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
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <span>Sudah punya akun? </span>
          <Link href="/login" className="font-medium text-[#01959F] hover:text-[#017a84]">
            Masuk
          </Link>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Dengan mendaftar, Anda menyetujui Syarat & Ketentuan dan Kebijakan Privasi kami.
        </div>
      </div>
    </div>
  );
}