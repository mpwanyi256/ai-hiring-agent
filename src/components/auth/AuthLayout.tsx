'use client';

import { ReactNode, useState, useEffect } from 'react';
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

// Testimonial data
const testimonials = [
  {
    quote: `${app.name} has revolutionized our hiring process. The AI-powered assessments and detailed candidate assessments have helped us find the perfect fit for our team in record time.`,
    author: 'Sarah Johnson',
    title: 'Head of Talent - TechCorp',
    avatar: '👩‍💼',
  },
  {
    quote:
      'The automated screening process saved us hours of manual work. We can now focus on what matters most - building relationships with top candidates.',
    author: 'Michael Chen',
    title: 'CTO - StartupXYZ',
    avatar: '👨‍💻',
  },
  {
    quote:
      'The AI interviews are incredibly insightful. We get detailed feedback that helps us make better hiring decisions than traditional interviews.',
    author: 'Emily Rodriguez',
    title: 'HR Director - GrowthCorp',
    avatar: '👩‍🎓',
  },
];

export default function AuthLayout({
  children,
  footerText,
  footerLink,
  showTestimonial = true,
}: AuthLayoutProps) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    if (!showTestimonial) return;

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [showTestimonial]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navigation />
      <div className="flex-1 flex">
        {/* Left Side - Form */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-start justify-center px-6 py-8 lg:px-12 overflow-y-auto">
            <div className="w-full max-w-md pt-4 pb-8">
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
        </div>

        {/* Right Side - Dynamic Carousel with Background */}
        {showTestimonial && (
          <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80')`,
              }}
            >
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center justify-center w-full">
              <div className="max-w-lg px-8 text-center">
                {/* Testimonial */}
                <blockquote className="mb-8">
                  <p className="text-lg text-white font-medium mb-6 leading-relaxed drop-shadow-sm">
                    &quot;{testimonials[currentTestimonial].quote}&quot;
                  </p>
                  <footer>
                    <div className="font-semibold text-white text-lg">
                      {testimonials[currentTestimonial].author}
                    </div>
                    <div className="text-white/80 text-sm">
                      {testimonials[currentTestimonial].title}
                    </div>
                  </footer>
                </blockquote>

                {/* Navigation dots */}
                <div className="flex justify-center space-x-3">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonial
                          ? 'bg-white scale-110'
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
