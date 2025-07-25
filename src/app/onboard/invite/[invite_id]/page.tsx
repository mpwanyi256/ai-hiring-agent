'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import TopNavigation from '@/components/navigation/TopNavigation';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Form validation schema
const inviteSignupSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type InviteSignupData = z.infer<typeof inviteSignupSchema>;

interface InviteData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company_name: string;
  invited_by_name: string;
  expires_at: string;
  status: string;
}

export default function InviteOnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const inviteId = params.invite_id as string;

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<InviteSignupData>({
    resolver: zodResolver(inviteSignupSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Fetch invite data
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/teams/invite/${inviteId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to fetch invite');
          return;
        }

        // Check if invite is valid
        if (data.invite.status !== 'pending') {
          setError('This invite has already been processed or is no longer valid.');
          return;
        }

        // Check if invite is expired
        const expiresAt = new Date(data.invite.expires_at);
        if (expiresAt < new Date()) {
          setError(
            'This invite has expired. Please contact your administrator for a new invitation.',
          );
          return;
        }

        setInvite(data.invite);
      } catch (err) {
        setError('Failed to load invite. Please try again.');
        console.error('Error fetching invite:', err);
      } finally {
        setLoading(false);
      }
    };

    if (inviteId) {
      fetchInvite();
    }
  }, [inviteId]);

  const handleSubmit = async (data: InviteSignupData) => {
    if (!invite) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Create user account with invite metadata
      const signupResponse = await fetch('/api/auth/signup-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: invite.email,
          password: data.password,
          firstName: invite.first_name,
          lastName: invite.last_name,
          inviteId: invite.id,
        }),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        setError(signupData.error || 'Failed to create account');
        return;
      }

      // Redirect to email verification with invite context
      router.push(`/verify-email?email=${encodeURIComponent(invite.email)}&invite=${invite.id}`);
    } catch (err) {
      setError('An error occurred while creating your account. Please try again.');
      console.error('Signup failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectInvite = async () => {
    if (!invite) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/teams/invite/${invite.id}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/invite-rejected');
      } else {
        setError('Failed to reject invite. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error rejecting invite:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-text">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation showAuthButtons={false} />
        <div className="py-20 px-4">
          <Container>
            <div className="max-w-md mx-auto text-center">
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-light">
                <XCircleIcon className="w-16 h-16 text-accent-red mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-text mb-4">Invalid Invitation</h1>
                <p className="text-muted-text mb-6">{error}</p>
                <Link href="/signin">
                  <Button>Go to Sign In</Button>
                </Link>
              </div>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation showAuthButtons={false} />
      <div className="py-8 sm:py-20 px-4 sm:px-0">
        <Container>
          <div className="max-w-md mx-auto">
            <div className="bg-white p-4 sm:p-8 rounded-lg shadow-sm border border-gray-light">
              {/* Invitation Header */}
              <div className="text-center mb-6 sm:mb-8">
                <CheckCircleIcon className="w-16 h-16 text-primary mx-auto mb-4" />
                <h1 className="text-xl sm:text-2xl font-bold text-text mb-2">
                  You&apos;re Invited to Join {invite?.company_name}
                </h1>
                <p className="text-sm sm:text-base text-muted-text">
                  {invite?.invited_by_name} has invited you to join their team as a {invite?.role}
                </p>
              </div>

              {/* Invite Details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-text">Email:</span>
                    <span className="font-medium">{invite?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text">Name:</span>
                    <span className="font-medium">
                      {invite?.first_name} {invite?.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-text">Role:</span>
                    <span className="font-medium capitalize">{invite?.role}</span>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                  <p className="text-accent-red text-sm">{error}</p>
                  <button
                    onClick={() => setError('')}
                    className="text-accent-red text-xs underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Password Form */}
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mb-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
                    Create Password *
                  </label>
                  <div className="relative">
                    <input
                      {...form.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="Enter your password"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-muted-text" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-muted-text" />
                      )}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-accent-red text-sm mt-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-text mb-2"
                  >
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      {...form.register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-muted-text" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-muted-text" />
                      )}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-accent-red text-sm mt-1">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Accept Invitation & Create Account
                </Button>
              </form>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleRejectInvite}
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-sm text-muted-text hover:text-text transition-colors disabled:opacity-50"
                >
                  Decline Invitation
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-muted-text">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="text-primary hover:text-primary-light">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:text-primary-light">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
