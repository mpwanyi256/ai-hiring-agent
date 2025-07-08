'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import TopNavigation from '@/components/navigation/TopNavigation';
import { signUp } from '@/store/auth/authThunks';
import { clearError } from '@/store/auth/authSlice';
import { ArrowRightIcon, ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { RootState } from '@/store';
import { useAppDispatch } from '@/store';

// Form validation schemas
const step1Schema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
});

const step2Schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

const step3Schema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords don&apos;t match',
    path: ['confirmPassword'],
  });

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

type FormData = Step1Data & Step2Data & Step3Data;

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth) as {
    isLoading: boolean;
    error: string | null;
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1 Form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      companyName: formData.companyName || '',
    },
  });

  // Step 2 Form
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
    },
  });

  // Step 3 Form
  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      email: formData.email || '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleStep1Submit = (data: Step1Data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleStep3Submit = async (data: Step3Data) => {
    const finalData = { ...formData, ...data };

    try {
      await dispatch(
        signUp({
          email: finalData.email!,
          password: finalData.password,
          firstName: finalData.firstName!,
          lastName: finalData.lastName!,
        }),
      ).unwrap();

      // Redirect to verification page with email parameter
      router.push(`/verify-email?email=${encodeURIComponent(finalData.email!)}`);
    } catch (error) {
      // Error is handled by Redux
      console.error('Signup failed:', error);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const clearFormError = () => {
    dispatch(clearError());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Centralized Navigation */}
      <TopNavigation showAuthButtons={false} />

      {/* Main Content */}
      <div className="py-6 sm:py-12 px-4 sm:px-0">
        <Container>
          <div className="max-w-md mx-auto">
            {/* Progress Bar */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm font-medium text-text">
                  Step {currentStep} of 3
                </span>
                <span className="text-xs sm:text-sm text-muted-text">
                  {currentStep === 1 && 'Company Details'}
                  {currentStep === 2 && 'Personal Information'}
                  {currentStep === 3 && 'Account Setup'}
                </span>
              </div>
              <div className="w-full bg-surface rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                <p className="text-accent-red text-sm">{error}</p>
                <button onClick={clearFormError} className="text-accent-red text-xs underline mt-1">
                  Dismiss
                </button>
              </div>
            )}

            {/* Step 1: Company Details */}
            {currentStep === 1 && (
              <div className="bg-white p-4 sm:p-8 rounded-lg shadow-sm border border-gray-light">
                <h1 className="text-xl sm:text-2xl font-bold text-text mb-2">
                  Create Your Account
                </h1>
                <p className="text-sm sm:text-base text-muted-text mb-4 sm:mb-6">
                  Let&apos;s start with your company information
                </p>

                <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-text mb-2"
                    >
                      Company Name *
                    </label>
                    <input
                      {...step1Form.register('companyName')}
                      type="text"
                      id="companyName"
                      placeholder="Enter your company name"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                    />
                    {step1Form.formState.errors.companyName && (
                      <p className="text-accent-red text-sm mt-1">
                        {step1Form.formState.errors.companyName.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full">
                    Continue
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </div>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <div className="bg-white p-4 sm:p-8 rounded-lg shadow-sm border border-gray-light">
                <h1 className="text-xl sm:text-2xl font-bold text-text mb-2">
                  Personal Information
                </h1>
                <p className="text-sm sm:text-base text-muted-text mb-4 sm:mb-6">
                  Tell us a bit about yourself
                </p>

                <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-text mb-2"
                      >
                        First Name *
                      </label>
                      <input
                        {...step2Form.register('firstName')}
                        type="text"
                        id="firstName"
                        placeholder="First name"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                      />
                      {step2Form.formState.errors.firstName && (
                        <p className="text-accent-red text-sm mt-1">
                          {step2Form.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-text mb-2"
                      >
                        Last Name *
                      </label>
                      <input
                        {...step2Form.register('lastName')}
                        type="text"
                        id="lastName"
                        placeholder="Last name"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                      />
                      {step2Form.formState.errors.lastName && (
                        <p className="text-accent-red text-sm mt-1">
                          {step2Form.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPreviousStep}
                      className="flex-1 order-2 sm:order-1"
                    >
                      <ArrowLeftIcon className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1 order-1 sm:order-2">
                      Continue
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Account Setup */}
            {currentStep === 3 && (
              <div className="bg-white p-4 sm:p-8 rounded-lg shadow-sm border border-gray-light">
                <h1 className="text-xl sm:text-2xl font-bold text-text mb-2">Account Setup</h1>
                <p className="text-sm sm:text-base text-muted-text mb-4 sm:mb-6">
                  Create your login credentials
                </p>

                <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                      Business Email *
                    </label>
                    <input
                      {...step3Form.register('email')}
                      type="email"
                      id="email"
                      placeholder="Enter your business email"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                    />
                    {step3Form.formState.errors.email && (
                      <p className="text-accent-red text-sm mt-1">
                        {step3Form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        {...step3Form.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        placeholder="Create a secure password"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-text"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                    {step3Form.formState.errors.password && (
                      <p className="text-accent-red text-sm mt-1">
                        {step3Form.formState.errors.password.message}
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
                        {...step3Form.register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        placeholder="Confirm your password"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-text"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                    {step3Form.formState.errors.confirmPassword && (
                      <p className="text-accent-red text-sm mt-1">
                        {step3Form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPreviousStep}
                      className="flex-1 order-2 sm:order-1"
                    >
                      <ArrowLeftIcon className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 order-1 sm:order-2"
                      isLoading={isLoading}
                    >
                      Create Account
                    </Button>
                  </div>
                </form>

                <div className="mt-4 sm:mt-6 text-center">
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
            )}
          </div>
        </Container>
      </div>
    </div>
  );
}
