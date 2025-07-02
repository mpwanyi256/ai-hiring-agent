'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import TopNavigation from '@/components/navigation/TopNavigation';
import { checkAuth } from '@/store/auth/authThunks';
import { AppDispatch } from '@/app/store';
import { 
  KeyIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);
  const [lastCodeSentAt, setLastCodeSentAt] = useState<Date | null>(null);
  
  const email = searchParams.get('email') || '';

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
          type: 'email'
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
        router.push('/dashboard');
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
          type: 'signup'
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

  const isCodeComplete = code.every(digit => digit !== '');
  const canResend = resendCooldown === 0 && !isResending;
  const timeRemaining = lastCodeSentAt ? Math.max(0, 60 - Math.floor((Date.now() - lastCodeSentAt.getTime()) / 1000)) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Centralized Navigation */}
      <TopNavigation showAuthButtons={false} />

      {/* Main Content */}
      <div className="py-6 sm:py-12 px-4 sm:px-0">
        <Container>
          <div className="max-w-md mx-auto">
            <div className="bg-white p-4 sm:p-8 rounded-lg shadow-sm border border-gray-light text-center">
              {/* Icon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <KeyIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-text mb-3 sm:mb-4">Verify Your Email</h1>
              
              {/* Description */}
              <p className="text-sm sm:text-base text-muted-text mb-4 sm:mb-6">
                We&apos;ve sent a 6-digit verification code to{' '}
                <span className="font-medium text-text break-all">{email}</span>
                {timeRemaining > 0 && (
                  <span className="block text-xs mt-2 text-primary">
                    Code expires in {timeRemaining} seconds
                  </span>
                )}
                {codeExpired && (
                  <span className="block text-xs mt-2 text-accent-red">
                    Code has expired. Please request a new one.
                  </span>
                )}
              </p>

              {/* Success Message */}
              {showSuccess && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-primary">
                    <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <p className="text-sm font-medium">New verification code sent!</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                  <p className="text-accent-red text-sm">{error}</p>
                  {codeExpired && (
                    <div className="mt-3">
                      <Button
                        onClick={() => handleResendCode()}
                        disabled={!canResend}
                        size="sm"
                        className="w-full"
                      >
                        {isResending ? 'Sending...' : 'Send New Code'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Code Input */}
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onPaste={handlePaste}
                      className={`w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                        codeExpired 
                          ? 'border-accent-red/30 bg-accent-red/5 focus:ring-accent-red/50' 
                          : 'border-gray-light focus:ring-primary'
                      }`}
                      disabled={codeExpired}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-text">
                  Enter the 6-digit code from your email
                </p>
              </div>

              {/* Verify Button */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
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

              {/* Back to Signup */}
              <div className="pt-4 sm:pt-6 border-t border-gray-light">
                <Link 
                  href="/signup" 
                  className="inline-flex items-center text-sm text-muted-text hover:text-primary"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Signup
                </Link>
              </div>

              {/* Free Tier Info */}
              <div className="mt-4 sm:mt-6 bg-gradient-to-r from-primary/5 to-accent-blue/5 rounded-lg border border-primary/20 p-3 sm:p-4">
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
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-text">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
} 