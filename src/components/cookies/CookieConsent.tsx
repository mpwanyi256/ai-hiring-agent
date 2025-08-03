'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XMarkIcon, CogIcon } from '@heroicons/react/24/outline';

interface CookieConsentProps {
  onAccept?: () => void;
  onReject?: () => void;
  onCustomize?: () => void;
}

export default function CookieConsent({ onAccept, onReject, onCustomize }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = document.cookie.includes('cookie_consent');
    if (!hasConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    const preferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };

    // Save preferences
    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    document.cookie = `cookie_consent=${JSON.stringify(preferences)}; max-age=${365 * 24 * 60 * 60}; path=/`;

    setIsVisible(false);
    onAccept?.();
  };

  const handleReject = () => {
    const preferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };

    // Save preferences
    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    document.cookie = `cookie_consent=${JSON.stringify(preferences)}; max-age=${365 * 24 * 60 * 60}; path=/`;

    setIsVisible(false);
    onReject?.();
  };

  const handleCustomize = () => {
    setIsVisible(false);
    // Navigate to cookie preferences page
    router.push('/cookie-preferences');
    onCustomize?.();
  };

  const handlePolicyClick = () => {
    setIsVisible(false);
    // Navigate to cookie policy page
    router.push('/cookie-policy');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <CogIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text mb-1">
                  We use cookies to enhance your experience
                </h3>
                <p className="text-sm text-muted-text leading-relaxed">
                  We use cookies and similar technologies to ensure you get the best experience on
                  our website. By clicking &ldquo;Accept all cookies&rdquo;, you consent to our use
                  of cookies for analytics and marketing purposes. You can{' '}
                  <button onClick={handlePolicyClick} className="text-primary hover:underline">
                    learn more about our cookie policy
                  </button>{' '}
                  or{' '}
                  <button onClick={handleCustomize} className="text-primary hover:underline">
                    customize your preferences
                  </button>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCustomize}
              className="flex items-center gap-2"
            >
              <CogIcon className="w-4 h-4" />
              Cookie preferences
            </Button>
            <Button variant="outline" size="sm" onClick={handleReject}>
              Disable non-necessary cookies
            </Button>
            <Button size="sm" onClick={handleAccept}>
              Accept all cookies
            </Button>
          </div>

          {/* Close button */}
          <button
            onClick={handleReject}
            className="absolute top-4 right-4 text-muted-text hover:text-text transition-colors"
            aria-label="Close cookie banner"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
