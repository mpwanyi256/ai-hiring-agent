'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/auth/AuthLayout';
import { signUp, validateCompanyName } from '@/store/auth/authThunks';
import { clearError } from '@/store/auth/authSlice';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { RootState } from '@/store';
import { useAppDispatch } from '@/store';
import { debounce } from 'lodash';

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

// Storage key for persisting signup state
const SIGNUP_STORAGE_KEY = 'intavia_signup_progress';

interface SignupProgress {
  currentStep: number;
  formData: Partial<FormData>;
  timestamp: number;
}

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

  // Company name validation state
  const [companyNameValidation, setCompanyNameValidation] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
    suggestions: string[];
  }>({
    isChecking: false,
    isAvailable: null,
    message: '',
    suggestions: [],
  });

  // Load saved progress on component mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(SIGNUP_STORAGE_KEY);
    if (savedProgress) {
      try {
        const progress: SignupProgress = JSON.parse(savedProgress);
        // Only restore if less than 1 hour old
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        if (progress.timestamp > oneHourAgo) {
          setCurrentStep(progress.currentStep);
          setFormData(progress.formData);
        } else {
          // Clear expired progress
          localStorage.removeItem(SIGNUP_STORAGE_KEY);
        }
      } catch (error) {
        // Clear invalid progress data
        localStorage.removeItem(SIGNUP_STORAGE_KEY);
      }
    }
  }, []);

  // Save progress whenever step or formData changes
  useEffect(() => {
    const progress: SignupProgress = {
      currentStep,
      formData,
      timestamp: Date.now(),
    };
    localStorage.setItem(SIGNUP_STORAGE_KEY, JSON.stringify(progress));
  }, [currentStep, formData]);

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

  // Update form defaults when formData changes (for restored state)
  useEffect(() => {
    step1Form.reset({ companyName: formData.companyName || '' });
  }, [formData.companyName, step1Form]);

  useEffect(() => {
    step2Form.reset({
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
    });
  }, [formData.firstName, formData.lastName, step2Form]);

  useEffect(() => {
    step3Form.reset({
      email: formData.email || '',
      password: '',
      confirmPassword: '',
    });
  }, [formData.email, step3Form]);

  // Debounced company name validation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedValidateCompanyName = useCallback(
    debounce(async (companyName: string) => {
      if (companyName.length < 2) {
        setCompanyNameValidation({
          isChecking: false,
          isAvailable: null,
          message: '',
          suggestions: [],
        });
        return;
      }

      setCompanyNameValidation((prev) => ({ ...prev, isChecking: true }));

      try {
        const result = await dispatch(validateCompanyName({ companyName })).unwrap();
        setCompanyNameValidation({
          isChecking: false,
          isAvailable: result.isAvailable,
          message: result.message,
          suggestions: result.suggestions || [],
        });
      } catch {
        setCompanyNameValidation({
          isChecking: false,
          isAvailable: false,
          message: 'Error checking company name availability',
          suggestions: [],
        });
      }
    }, 500),
    [dispatch],
  );

  const handleStep1Submit = (data: Step1Data) => {
    if (companyNameValidation.isAvailable === false) {
      return; // Don't proceed if company name is not available
    }
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
          companyName: finalData.companyName!,
        }),
      ).unwrap();

      // Clear the signup progress since account is created
      localStorage.removeItem(SIGNUP_STORAGE_KEY);

      // Redirect to email verification with plan selection as next step
      router.push(`/verify-email?email=${encodeURIComponent(finalData.email!)}&next=plans`);
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

  const selectSuggestedCompanyName = (suggestion: string) => {
    step1Form.setValue('companyName', suggestion);
    debouncedValidateCompanyName(suggestion);
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text">Step {currentStep} of 3</span>
                <span className="text-sm text-muted-text">Company Details</span>
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
              <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                <p className="text-accent-red text-sm">{error}</p>
                <button onClick={clearFormError} className="text-accent-red text-xs underline mt-1">
                  Dismiss
                </button>
              </div>
            )}

            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-text mb-2">
                  Company Name *
                </label>
                <div className="relative">
                  <input
                    {...step1Form.register('companyName', {
                      onChange: (e) => debouncedValidateCompanyName(e.target.value),
                    })}
                    type="text"
                    id="companyName"
                    placeholder="Enter your company name"
                    className="w-full px-4 py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {companyNameValidation.isChecking && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                    {!companyNameValidation.isChecking &&
                      companyNameValidation.isAvailable === true && (
                        <CheckIcon className="w-4 h-4 text-green-500" />
                      )}
                    {!companyNameValidation.isChecking &&
                      companyNameValidation.isAvailable === false && (
                        <XMarkIcon className="w-4 h-4 text-red-500" />
                      )}
                  </div>
                </div>

                {/* Validation Message */}
                {companyNameValidation.message && (
                  <p
                    className={`text-sm mt-1 ${companyNameValidation.isAvailable ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {companyNameValidation.message}
                  </p>
                )}

                {/* Form Validation Error */}
                {step1Form.formState.errors.companyName && (
                  <p className="text-accent-red text-sm mt-1">
                    {step1Form.formState.errors.companyName.message}
                  </p>
                )}

                {/* Suggestions */}
                {companyNameValidation.suggestions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-text mb-2">Try these alternatives:</p>
                    <div className="flex flex-wrap gap-2">
                      {companyNameValidation.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectSuggestedCompanyName(suggestion)}
                          className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={companyNameValidation.isAvailable === false}
              >
                Continue
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text">Step {currentStep} of 3</span>
                <span className="text-sm text-muted-text">Personal Information</span>
              </div>
              <div className="w-full bg-surface rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-text mb-2">
                    First Name *
                  </label>
                  <input
                    {...step2Form.register('firstName')}
                    type="text"
                    id="firstName"
                    placeholder="First name"
                    className="w-full px-4 py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {step2Form.formState.errors.firstName && (
                    <p className="text-accent-red text-sm mt-1">
                      {step2Form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-text mb-2">
                    Last Name *
                  </label>
                  <input
                    {...step2Form.register('lastName')}
                    type="text"
                    id="lastName"
                    placeholder="Last name"
                    className="w-full px-4 py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {step2Form.formState.errors.lastName && (
                    <p className="text-accent-red text-sm mt-1">
                      {step2Form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  className="flex-1"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Continue
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text">Step {currentStep} of 3</span>
                <span className="text-sm text-muted-text">Account Setup</span>
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
              <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                <p className="text-accent-red text-sm">{error}</p>
                <button onClick={clearFormError} className="text-accent-red text-xs underline mt-1">
                  Dismiss
                </button>
              </div>
            )}

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
                  className="w-full px-4 py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    className="w-full px-4 py-3 pr-12 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text hover:text-text"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {step3Form.formState.errors.confirmPassword && (
                  <p className="text-accent-red text-sm mt-1">
                    {step3Form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  className="flex-1"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthLayout
      title={
        currentStep === 1
          ? 'Welcome 👋'
          : currentStep === 2
            ? 'Tell us about yourself'
            : 'Almost there!'
      }
      subtitle={
        currentStep === 1
          ? "Let's start with your company information"
          : currentStep === 2
            ? "We'd like to know who you are"
            : 'Create your login credentials'
      }
      footerText="Already have an account?"
      footerLink={{
        text: 'Sign in here',
        href: '/signin',
      }}
    >
      {getStepContent()}
    </AuthLayout>
  );
}
