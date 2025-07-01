'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { RootState } from '@/store';
import { 
  EnvelopeIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Redirect if not signed up
  useEffect(() => {
    if (!user) {
      router.push('/signup');
    }
  }, [user, router]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    // TODO: Implement resend email functionality
    // This would call Supabase to resend confirmation email
    console.log('Resending confirmation email...');
    setCountdown(60);
    setCanResend(false);
  };

  if (!user) {
    return null; // Will redirect in useEffect
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
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <div className="py-20">
        <Container>
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-light">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <EnvelopeIcon className="w-8 h-8 text-primary" />
              </div>

              <h1 className="text-2xl font-bold text-text mb-4">
                Check Your Email
              </h1>
              
              <p className="text-muted-text mb-6">
                We&apos;ve sent a confirmation link to{' '}
                <span className="font-medium text-text">{user.email}</span>
              </p>

              <div className="bg-surface p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center mb-3">
                  <CheckCircleIcon className="w-5 h-5 text-primary mr-2" />
                  <span className="text-sm font-medium text-text">Next Steps:</span>
                </div>
                <ol className="text-sm text-muted-text text-left space-y-2">
                  <li>1. Check your email inbox</li>
                  <li>2. Click the confirmation link</li>
                  <li>3. Return here to access your dashboard</li>
                </ol>
              </div>

              {/* Resend Email */}
              <div className="mb-6">
                {canResend ? (
                  <Button 
                    variant="outline" 
                    onClick={handleResendEmail}
                    className="w-full"
                  >
                    Resend Confirmation Email
                  </Button>
                ) : (
                  <p className="text-sm text-muted-text">
                    Didn&apos;t receive the email? You can resend it in {countdown}s
                  </p>
                )}
              </div>

              {/* Help Text */}
              <div className="text-xs text-muted-text">
                <p className="mb-2">
                  <strong>Can&apos;t find the email?</strong> Check your spam or junk folder.
                </p>
                <p>
                  Need help? <Link href="/contact" className="text-primary hover:text-primary-light">Contact support</Link>
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 text-center">
              <h2 className="text-lg font-semibold text-text mb-4">While You Wait...</h2>
              <div className="grid gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-light">
                  <h3 className="font-medium text-text mb-2">🎉 You&apos;re on the Free Tier</h3>
                  <p className="text-sm text-muted-text">
                    Start with 1 active job and up to 5 interviews per month
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-light">
                  <h3 className="font-medium text-text mb-2">🚀 What&apos;s Next</h3>
                  <p className="text-sm text-muted-text">
                    Create your first job posting and start interviewing candidates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
} 