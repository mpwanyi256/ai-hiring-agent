'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Navigation from '@/components/landing/Navigation';
import {
  ShieldCheckIcon,
  CogIcon,
  ChartBarIcon,
  MegaphoneIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookiePreferencesPage() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem('cookie_preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPreferences({
        necessary: true, // Always true
        analytics: parsed.analytics || false,
        marketing: parsed.marketing || false,
      });
    }
  }, []);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem(
      'cookie_preferences',
      JSON.stringify({
        necessary: true,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
      }),
    );

    // Set cookie consent
    document.cookie = `cookie_consent=${JSON.stringify(preferences)}; max-age=${365 * 24 * 60 * 60}; path=/`;

    // Show success message
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);

    // Apply preferences (you would implement actual cookie management here)
    applyCookiePreferences(preferences);
  };

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // This is where you would enable/disable actual cookies based on preferences
    console.log('Applying cookie preferences:', prefs);

    // Example: Enable/disable Google Analytics
    if (prefs.analytics) {
      // Enable analytics
      console.log('Analytics enabled');
    } else {
      // Disable analytics
      console.log('Analytics disabled');
    }

    // Example: Enable/disable marketing cookies
    if (prefs.marketing) {
      // Enable marketing
      console.log('Marketing enabled');
    } else {
      // Disable marketing
      console.log('Marketing disabled');
    }
  };

  const cookieTypes = [
    {
      id: 'necessary',
      title: 'Necessary Cookies',
      description:
        'These cookies are essential for the website to function properly. They cannot be disabled.',
      icon: CogIcon,
      required: true,
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
    },
    {
      id: 'analytics',
      title: 'Analytics Cookies',
      description:
        'Help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      icon: ChartBarIcon,
      required: false,
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      id: 'marketing',
      title: 'Marketing Cookies',
      description:
        'Used to track visitors across websites to display relevant advertisements and measure marketing campaign effectiveness.',
      icon: MegaphoneIcon,
      required: false,
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text mb-4">Cookie Preferences</h1>
          <p className="text-lg text-muted-text">
            Manage your cookie preferences to control how we use cookies on our website.
          </p>
        </div>

        {/* Success Message */}
        {isSaved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700">
                Your cookie preferences have been saved successfully!
              </p>
            </div>
          </div>
        )}

        {/* Cookie Types */}
        <div className="space-y-6 mb-8">
          {cookieTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.id} className={`p-6 border rounded-lg ${type.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${type.iconColor}`} />
                    <div>
                      <h3 className="text-lg font-semibold text-text">{type.title}</h3>
                      {type.required && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={preferences[type.id as keyof CookiePreferences]}
                    onCheckedChange={(checked) => {
                      if (type.required) return; // Cannot disable required cookies
                      setPreferences((prev) => ({
                        ...prev,
                        [type.id]: checked,
                      }));
                    }}
                    disabled={type.required}
                  />
                </div>
                <p className="text-muted-text text-sm leading-relaxed">{type.description}</p>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleSave} className="flex-1 sm:flex-none">
            Save Preferences
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPreferences({
                necessary: true,
                analytics: true,
                marketing: true,
              });
            }}
            className="flex-1 sm:flex-none"
          >
            Accept All
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPreferences({
                necessary: true,
                analytics: false,
                marketing: false,
              });
            }}
            className="flex-1 sm:flex-none"
          >
            Reject All
          </Button>
        </div>

        {/* Additional Information */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-text mb-3">Need more information?</h3>
          <p className="text-muted-text text-sm mb-4">
            Learn more about how we use cookies and your rights regarding data privacy.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/cookie-policy">
              <Button variant="outline" size="sm">
                Cookie Policy
              </Button>
            </Link>
            <Link href="/privacy-policy">
              <Button variant="outline" size="sm">
                Privacy Policy
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="sm">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-text">
          <p>You can change these preferences at any time by visiting this page.</p>
        </div>
      </div>
    </div>
  );
}
