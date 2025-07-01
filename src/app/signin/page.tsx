'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { signIn, clearError } from '@/store/slices/authSlice';
import { RootState, AppDispatch } from '@/store';
import { 
  SparklesIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

// Form validation schema
const signinSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SigninData = z.infer<typeof signinSchema>;

export default function SigninPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
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
    } catch (error) {
      // Error is handled by Redux
      console.error('Signin failed:', error);
    }
  };

  const clearFormError = () => {
    dispatch(clearError());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface bg-white shadow-sm">
        <Container>
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">AI Hiring Agent</span>
            </Link>
            <div className="text-sm text-muted-text">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:text-primary-light font-medium">
                Sign up
              </Link>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <div className="py-20">
        <Container>
          <div className="max-w-md mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-light">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-text mb-2">Welcome Back</h1>
                <p className="text-muted-text">Sign in to your AI Hiring Agent account</p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                  <p className="text-accent-red text-sm">{error}</p>
                  <button
                    onClick={clearFormError}
                    className="text-accent-red text-xs underline mt-1"
                  >
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
                    <p className="text-accent-red text-sm mt-1">
                      {form.formState.errors.email.message}
                    </p>
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

                <Button 
                  type="submit" 
                  className="w-full"
                  isLoading={isLoading}
                >
                  Sign In
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-text">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-primary hover:text-primary-light font-medium">
                    Get started for free
                  </Link>
                </p>
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-text">
                Need help?{' '}
                <Link href="/contact" className="text-primary hover:text-primary-light">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
} 