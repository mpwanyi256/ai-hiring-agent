'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { supabase } from '@/lib/supabase';
import { checkAuth } from '@/store/slices/authSlice';
import { AppDispatch } from '@/store';
import { 
  EnvelopeIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated (email confirmed)
    const checkAuthStatus = async () => {
      try {
        await dispatch(checkAuth()).unwrap();
        // If we get here, user is authenticated, redirect to dashboard
        router.push('/dashboard');
      } catch {
        // User not authenticated yet, that's expected
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [dispatch, router]);

  useEffect(() => {
    // Listen for auth state changes (email confirmation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User has confirmed email and is signed in
        await dispatch(checkAuth());
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch, router]);

  useEffect(() => {
    // Cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: '', // Supabase will use the current session email
      });

      if (error) {
        console.error('Error resending email:', error);
        return;
      }

      setShowSuccess(true);
      setResendCooldown(60);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error('Error resending email:', err);
    } finally {
      setIsResending(false);
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-text">Checking authentication...</p>
        </div>
      </div>
    );
  }

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
              Need help?{' '}
              <Link href="/support" className="text-primary hover:text-primary-light font-medium">
                Contact Support
              </Link>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <div className="py-12">
        <Container>
          <div className="max-w-md mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-light text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <EnvelopeIcon className="w-8 h-8 text-primary" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-text mb-4">Check Your Email</h1>
              
              {/* Description */}
              <p className="text-muted-text mb-6">
                We&apos;ve sent a confirmation link to your email address. 
                Click the link to verify your account and start using AI Hiring Agent.
              </p>

              {/* Success Message */}
              {showSuccess && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-primary">
                    <CheckCircleIcon className="w-5 h-5" />
                    <p className="text-sm font-medium">Confirmation email sent!</p>
                  </div>
                </div>
              )}

              {/* Free Tier Info */}
              <div className="bg-gradient-to-r from-primary/5 to-accent-blue/5 rounded-lg border border-primary/20 p-4 mb-6">
                <h3 className="font-semibold text-text mb-2">🎉 You&apos;re on the Free Tier</h3>
                <p className="text-sm text-muted-text mb-2">
                  Your account includes:
                </p>
                <ul className="text-sm text-muted-text text-left space-y-1">
                  <li>• 1 active job posting</li>
                  <li>• 5 AI interviews per month</li>
                  <li>• Basic candidate reports</li>
                  <li>• Email support</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending || resendCooldown > 0}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Resend Email'
                  )}
                </Button>

                <p className="text-xs text-muted-text">
                  Didn&apos;t receive the email? Check your spam folder or{' '}
                  <Link href="/support" className="text-primary hover:text-primary-light">
                    contact support
                  </Link>
                </p>
              </div>

              {/* Next Steps */}
              <div className="mt-8 pt-6 border-t border-gray-light">
                <h4 className="font-semibold text-text mb-3">What happens next?</h4>
                <div className="text-left space-y-2">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      1
                    </div>
                    <p className="text-sm text-muted-text">Confirm your email address</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      2
                    </div>
                    <p className="text-sm text-muted-text">Access your dashboard</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      3
                    </div>
                    <p className="text-sm text-muted-text">Create your first job post</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
} 