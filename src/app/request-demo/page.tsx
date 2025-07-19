'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';

const demoFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type DemoFormData = z.infer<typeof demoFormSchema>;

export default function RequestDemoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
  });

  const onSubmit = async (data: DemoFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/request-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitStatus('success');
        reset();
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSuccess = () => {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Container>
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-4">Demo Request Sent!</h1>
            <p className="text-muted-text mb-8">
              Thank you for your interest! We&apos;ll get back to you within 24 hours to schedule
              your personalized demo.
            </p>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  };

  const renderForm = () => {
    return (
      <Container>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-text mb-4">Request a Demo</h1>
            <p className="text-lg text-muted-text">
              See how Intavia can transform your recruitment process. Get a personalized demo
              tailored to your needs.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-text">
                    Full Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 border rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-light'
                    }`}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-text">
                    Business Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    placeholder="john@company.com"
                    className={`w-full px-4 py-3 border rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-light'
                    }`}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="company" className="block text-sm font-medium text-text">
                  Company Name *
                </label>
                <input
                  {...register('company')}
                  type="text"
                  id="company"
                  placeholder="Your Company"
                  className={`w-full px-4 py-3 border rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.company ? 'border-red-500' : 'border-gray-light'
                  }`}
                />
                {errors.company && <p className="text-sm text-red-500">{errors.company.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-text">
                  Tell us about your hiring needs *
                </label>
                <textarea
                  {...register('message')}
                  id="message"
                  placeholder="What roles are you hiring for? How many candidates do you typically screen? Any specific challenges you're facing?"
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                    errors.message ? 'border-red-500' : 'border-gray-light'
                  }`}
                />
                {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
              </div>

              {submitStatus === 'error' && (
                <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700">
                    Something went wrong. Please try again or contact us directly.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? 'Sending Request...' : 'Request Demo'}
              </Button>
            </form>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-text">
              We&apos;ll respond within 24 hours to schedule your personalized demo.
            </p>
          </div>
        </div>
      </Container>
    );
  };

  return (
    <div className="min-h-screen bg-background text-text overflow-x-hidden">
      <Navigation />
      <section className="relative z-10 pt-24 pb-16">
        {submitStatus === 'success' ? renderSuccess() : renderForm()}
      </section>
      <Footer />
    </div>
  );
}
