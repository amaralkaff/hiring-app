'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { createAdminUser } from '@/app/auth/actions';
import { cn } from '@/lib/utils';

const setupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SetupFormData = z.infer<typeof setupSchema>;

export default function SetupPage() {
  const [authError, setAuthError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      email: 'admin@hiring-app.com',
      password: 'password123',
    },
  });

  const onSubmit = async (data: SetupFormData) => {
    setAuthError('');
    setIsPending(true);

    try {
      const formData = new FormData();
      formData.set('email', data.email);
      formData.set('password', data.password);

      const result = await createAdminUser(formData);
      if (result?.error) {
        setAuthError(result.error);
      } else if (result?.success && result?.message) {
        setAuthError(result.message);
      }
      // If successful, the action will handle redirection
  } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Setup Admin Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create the initial admin user for the hiring system
          </p>
          {authError && (
            <p className={cn(
              "mt-2 text-center text-sm",
              authError.includes('created') ? "text-green-600" : "text-red-600"
            )}>
              {authError}
            </p>
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
                      placeholder="Enter admin email"
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-s-regular text-neutral-100">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Create admin password"
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
                    Creating admin account...
                  </span>
                ) : (
                  'Create Admin Account'
                )}
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            After setup, use these credentials to login:
          </p>
          <p className="font-mono mt-2">
            Email: admin@hiring-app.com<br />
            Password: password123
          </p>
        </div>
      </div>
    </div>
  );
}