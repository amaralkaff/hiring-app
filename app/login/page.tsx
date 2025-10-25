'use client';

import { useState, Suspense } from 'react';
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

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const [authError, setAuthError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);
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

  const onLoginSubmit = async (data: LoginFormData) => {
    setAuthError('');
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
        // Show success message instead of redirecting
        setAuthError('');
        // The user will be redirected after clicking the magic link
      }
    } finally {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {loginMethod === 'magic' ? 'Masuk dengan Tautan Ajaib' : 'Masuk ke Akun Anda'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {loginMethod === 'magic'
              ? 'Masukkan email Anda untuk menerima tautan masuk'
              : 'Masukkan email dan kata sandi Anda untuk masuk'
            }
          </p>
          {message && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600 text-center">{message}</p>
            </div>
          )}
          {(authError || error) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 text-center">
                {authError || message || 'Autentikasi gagal. Silakan coba lagi.'}
              </p>
              {error === 'confirmation_link_expired' && (
                <p className="text-xs text-red-500 text-center mt-2">
                  Tautan konfirmasi Anda telah kedaluwarsa. Silakan daftar lagi untuk menerima email konfirmasi baru.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Login Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onLoginSubmit)} className="space-y-6">
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

            {/* Password Field (shown when password login is selected) */}
            {loginMethod === 'password' && (
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-s-regular text-neutral-100">
                        Kata Sandi
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="Masukkan kata sandi"
                          className={cn(
                            "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                            form.formState.errors.password
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
              </div>
            )}

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
                    {loginMethod === 'magic' ? 'Mengirim...' : 'Masuk...'}
                  </span>
                ) : (
                  loginMethod === 'magic' ? 'Kirim Tautan Ajaib' : 'Masuk'
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Password Login Option */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setLoginMethod(loginMethod === 'magic' ? 'password' : 'magic')}
            className="w-full text-sm text-[#01959F] hover:text-[#017a84] font-medium"
          >
            {loginMethod === 'magic' ? 'Masuk dengan kata sandi' : 'Masuk dengan tautan ajaib'}
          </button>
        </div>

        {/* Divider */}
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

        {/* Google Sign In */}
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
                Masuk dengan Google
              </>
            )}
          </Button>
        </form>

        {/* Signup Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <span>Belum punya akun? </span>
          <Link href="/signup" className="font-medium text-[#01959F] hover:text-[#017a84]">
            Daftar disini
          </Link>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          {loginMethod === 'magic'
            ? "Tidak diperlukan password. Anda akan menerima tautan ajaib di email Anda."
            : "Masukkan kata sandi Anda untuk masuk."
          }
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