'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { app } from '@/lib/constants';
import Navigation from '@/components/landing/Navigation';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  footerText?: string;
  footerLink?: {
    text: string;
    href: string;
  };
  showTestimonial?: boolean;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  footerText,
  footerLink,
  showTestimonial = true,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <Navigation />
      <div className="min-h-screen bg-background flex">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 lg:px-12">
          <div className="w-full max-w-md pt-4">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-text mb-2">{title}</h1>
              <p className="text-muted-text">{subtitle}</p>
            </div>

            {/* Form Content */}
            {children}

            {/* Footer */}
            {footerText && footerLink && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-text">
                  {footerText}{' '}
                  <Link
                    href={footerLink.href}
                    className="text-primary hover:text-primary-light font-medium"
                  >
                    {footerLink.text}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Illustration/Testimonial */}
        {showTestimonial && (
          <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary/10 to-primary/5 items-center justify-center relative overflow-hidden">
            <div className="relative z-10 max-w-lg px-8">
              {/* Illustration placeholder */}
              <div className="mb-8 text-center">
                <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <blockquote className="text-center">
                <p className="text-lg text-text mb-6 leading-relaxed">
                  &quot;{app.name} has revolutionized our hiring process. The AI-powered interviews
                  and detailed candidate assessments have helped us find the perfect fit for our
                  team in record time.&quot;
                </p>
                <footer>
                  <div className="font-medium text-text">Sarah Johnson</div>
                  <div className="text-sm text-muted-text">Head of Talent - TechCorp</div>
                </footer>
              </blockquote>

              {/* Navigation dots */}
              <div className="flex justify-center mt-8 space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="w-2 h-2 bg-primary/30 rounded-full"></div>
                <div className="w-2 h-2 bg-primary/30 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
