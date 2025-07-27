'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import AuthLayout from '@/components/auth/AuthLayout';
import { checkAuth } from '@/store/auth/authThunks';
import { KeyIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAppDispatch } from '@/store';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);
  const [lastCodeSentAt, setLastCodeSentAt] = useState<Date | null>(null);

  const email = searchParams.get('email') || '';
  const inviteId = searchParams.get('invite') || '';
  const nextStep = searchParams.get('next') || '';

  useEffect(() => {
    // Cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    // Check if code has expired (60 seconds after last send)
    if (lastCodeSentAt) {
      const checkExpiry = () => {
        const timeElapsed = Date.now() - lastCodeSentAt.getTime();
        const hasExpired = timeElapsed > 60000; // 60 seconds

        if (hasExpired && !codeExpired) {
          setCodeExpired(true);
          setError('Verification code has expired. Please request a new one.');
        }
      };

      const interval = setInterval(checkExpiry, 1000);
      return () => clearInterval(interval);
    }
  }, [lastCodeSentAt, codeExpired]);

  // Auto-send initial code when page loads
  useEffect(() => {
    if (email && !lastCodeSentAt) {
      handleResendCode(true); // Send initial code silently
    }
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return; // Only allow single digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');
    setCodeExpired(false);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedText.length === 6) {
      setCode(pastedText.split(''));
      setError('');
      setCodeExpired(false);
    }
  };

  const handleVerifyCode = async () => {
    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (codeExpired) {
      setError('This code has expired. Please request a new one.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token: verificationCode,
          type: 'email',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'expired') {
          setCodeExpired(true);
          setError('Verification code has expired. Please request a new one.');
        } else if (data.error === 'invalid') {
          setError('Invalid verification code. Please try again.');
        } else {
          setError(data.message || 'Verification failed. Please try again.');
        }
        return;
      }

      if (data.success && data.user) {
        // User is now verified and signed in
        await dispatch(checkAuth());

        // Determine where to redirect based on the next parameter
        if (nextStep === 'plans') {
          // Redirect to plan selection for new signups
          router.push(`/onboard/plans?email=${encodeURIComponent(email)}`);
        } else if (inviteId) {
          // Redirect to welcome page for invited users
          router.push('/dashboard?welcome=invite');
        } else {
          // Regular flow
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async (silent = false) => {
    if (!email) {
      setError('Email address is required to resend code');
      return;
    }

    setIsResending(true);
    if (!silent) {
      setError('');
    }

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          type: 'signup',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend code. Please try again.');
        return;
      }

      setLastCodeSentAt(new Date());
      setCodeExpired(false);
      setCode(['', '', '', '', '', '']);

      if (!silent) {
        setShowSuccess(true);
        setResendCooldown(60);
        setTimeout(() => setShowSuccess(false), 5000);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
      console.error('Resend error:', err);
    } finally {
      setIsResending(false);
    }
  };

  const isCodeComplete = code.every((digit) => digit !== '');
  const canResend = resendCooldown === 0 && !isResending;
  const timeRemaining = lastCodeSentAt
    ? Math.max(0, 60 - Math.floor((Date.now() - lastCodeSentAt.getTime()) / 1000))
    : 0;

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`We've sent a 6-digit verification code to ${email}`}
      footerText="Wrong email address?"
      footerLink={{
        text: 'Back to signup',
        href: '/signup',
      }}
    >
      <div className="space-y-6">
        {/* Success Message */}
        {showSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700 text-sm">Verification code sent successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Code Input */}
        <div>
          <label className="block text-sm font-medium text-text mb-4">
            Enter verification code
          </label>
          <div className="flex justify-center space-x-3 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className={`w-12 h-12 text-center text-lg font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  codeExpired ? 'border-red-300 bg-red-50' : 'border-gray-light bg-white'
                }`}
                disabled={isVerifying}
              />
            ))}
          </div>
        </div>

        {/* Timer */}
        {!codeExpired && timeRemaining > 0 && (
          <div className="text-center">
            <p className="text-sm text-muted-text">
              Code expires in {Math.max(resendCooldown, timeRemaining)} seconds
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleVerifyCode}
            disabled={!isCodeComplete || isVerifying || codeExpired}
            className="w-full"
            isLoading={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </Button>

          <Button
            onClick={() => handleResendCode()}
            disabled={!canResend}
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
            ) : codeExpired ? (
              'Send New Code'
            ) : (
              'Resend Code'
            )}
          </Button>

          {!codeExpired && timeRemaining > 0 && (
            <p className="text-xs text-muted-text text-center">
              You can request a new code in {Math.max(resendCooldown, timeRemaining)} seconds
            </p>
          )}
        </div>

        {/* Next Steps Info */}
        {nextStep === 'plans' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <KeyIcon className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <p className="text-blue-700 text-sm font-medium">Almost there!</p>
                <p className="text-blue-600 text-sm">
                  After verification, you&apos;ll choose your subscription plan and start your
                  14-day free trial.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back to Signup */}
        <div className="pt-4 border-t border-gray-light">
          <Link
            href="/signup"
            className="inline-flex items-center text-sm text-muted-text hover:text-primary"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Signup
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
