'use client';

import { useState } from 'react';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import { useToast } from '@/components/providers/ToastProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import { joinWaitlist } from '@/store/landing/landingThunks';
import { selectWaitlistLoading } from '@/store/landing/landingSelectors';
import Image from 'next/image';
import { app } from '@/lib/constants';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  const [email, setEmail] = useState('');
  const dispatch = useAppDispatch();
  const { success, error: showError } = useToast();
  const isLoading = useAppSelector(selectWaitlistLoading);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showError('Please enter your email address');
      return;
    }

    try {
      await dispatch(joinWaitlist({ email: email.trim() })).unwrap();
      setEmail('');
      success("Thanks for subscribing! We'll keep you updated with the latest news and features.");
    } catch {
      showError('Failed to subscribe. Please try again.');
    }
  };

  return (
    <footer className="relative z-10 py-16 bg-gray-900 text-white">
      <Container>
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                <Image src="/images/logo.png" alt={`${app.name} Logo`} width={40} height={40} />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent text-2xl">
                {app.name}
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md text-sm leading-relaxed">
              Transform your hiring process with AI-powered resume analysis and comprehensive Q&A
              evaluation. Make data-driven hiring decisions faster and more accurately than ever
              before.
            </p>

            {/* Newsletter Signup */}
            <div className="mb-6 flex flex-col gap-2">
              <h5 className="font-semibold mb-3 text-sm">Stay Updated</h5>
              <form onSubmit={handleNewsletterSubmit} className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                  required
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <ArrowRightIcon className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>

            {/* Social Links */}
            <div className="flex space-x-3">
              <a
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/intavia/"
                target="_blank"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Product</h4>
            <div className="space-y-3">
              <Link
                href="/#features"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                How It Works
              </Link>
              <Link
                href="/#why-choose"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                Resume Analysis
              </Link>
              <Link
                href="/#why-choose"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                Q&A Evaluation
              </Link>
              <Link
                href="/#why-choose"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                Automated Ranking
              </Link>
              <Link
                href="/pricing"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                Pricing
              </Link>
              <Link
                href="/#testimonials"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                Customer Stories
              </Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Company</h4>
            <div className="space-y-3">
              <Link
                href="#"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                About Us
              </Link>
              <Link
                href="#"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                Careers
              </Link>
              <Link
                href="#"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                Press
              </Link>
              <Link
                href="#"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                Blog
              </Link>
              <Link
                href="/faq"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="block text-gray-400 hover:text-white transition-colors text-sm"
              >
                Talk to Us
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Contact Us</h4>
            <div className="space-y-3 text-gray-400 text-sm">
              <div className="flex items-center space-x-2">
                <PhoneIcon className="w-4 h-4 text-primary" />
                <span>{app.address.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="w-4 h-4 text-primary" />
                <span>{app.email}</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPinIcon className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <div>{app.address.street}</div>
                  <div>{app.address.block}</div>
                  <div>{app.address.city}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              <p>
                © {`${new Date().getFullYear()}`} {app.name}. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookie-policy"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
