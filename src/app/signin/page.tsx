'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import AuthLayout from '@/components/auth/AuthLayout';
import { signIn } from '@/store/auth/authThunks';
import { clearError } from '@/store/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/store';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Form validation schema
const signinSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SigninData = z.infer<typeof signinSchema>;

export default function SigninPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth) as {
    isLoading: boolean;
    error: string | null;
  };
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SigninData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (data: SigninData) => {
    try {
      await dispatch(signIn(data)).unwrap();
      router.push('/dashboard');
    } catch (error: unknown) {
      // Check if it's an EMAIL_NOT_CONFIRMED error from the thunk
      if (
        error &&
        typeof error === 'object' &&
        'type' in error &&
        error.type === 'EMAIL_NOT_CONFIRMED' &&
        'email' in error
      ) {
        // Redirect to email verification page
        router.push(`/verify-email?email=${encodeURIComponent(error.email as string)}`);
        return;
      }

      // Check if it's a string message containing EMAIL_NOT_CONFIRMED
      if (error instanceof Error && error.message.includes('EMAIL_NOT_CONFIRMED')) {
        // Try to extract email from form data as fallback
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      // Other errors are handled by Redux state
      console.error('Signin failed:', error);
    }
  };

  const clearFormError = () => {
    dispatch(clearError());
  };

  return (
    <AuthLayout
      title="Welcome back 👋"
      subtitle="Sign in to your account"
      footerText="Don't have an account?"
      footerLink={{
        text: 'Get started for free',
        href: '/signup',
      }}
    >
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
            <p className="text-accent-red text-sm">{error}</p>
            <button onClick={clearFormError} className="text-accent-red text-xs underline mt-1">
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
              Email Address
            </label>
            <input
              {...form.register('email')}
              type="email"
              id="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {form.formState.errors.email && (
              <p className="text-accent-red text-sm mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
              Password
            </label>
            <div className="relative">
              <input
                {...form.register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-text"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-accent-red text-sm mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary focus:ring-primary border-gray-light rounded"
              />
              <span className="ml-2 text-muted-text">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-primary hover:text-primary-light">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        {/* OR Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-light" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-muted-text">OR</span>
          </div>
        </div>

        {/* Google Sign In */}
        <Button variant="outline" className="w-full" disabled>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Help Section */}
        <div className="text-center text-sm text-muted-text">
          Need help?{' '}
          <Link href="/contact" className="text-primary hover:text-primary-light">
            Contact support
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
