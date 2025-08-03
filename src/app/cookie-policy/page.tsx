'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/landing/Navigation';
import { ShieldCheckIcon, CogIcon, ChartBarIcon, MegaphoneIcon } from '@heroicons/react/24/outline';

export default function CookiePolicyPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ShieldCheckIcon },
    { id: 'necessary', label: 'Necessary', icon: CogIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'marketing', label: 'Marketing', icon: MegaphoneIcon },
  ];

  const cookieTypes = {
    necessary: [
      {
        name: 'session_id',
        purpose: 'Maintains your session and authentication state',
        duration: 'Session',
        provider: 'Intavia',
      },
      {
        name: 'csrf_token',
        purpose: 'Protects against cross-site request forgery attacks',
        duration: 'Session',
        provider: 'Intavia',
      },
      {
        name: 'cookie_consent',
        purpose: 'Stores your cookie preferences',
        duration: '1 year',
        provider: 'Intavia',
      },
    ],
    analytics: [
      {
        name: '_ga',
        purpose: 'Distinguishes unique users and tracks page views',
        duration: '2 years',
        provider: 'Google Analytics',
      },
      {
        name: '_ga_*',
        purpose: 'Stores session information and user behavior',
        duration: '2 years',
        provider: 'Google Analytics',
      },
      {
        name: '_gid',
        purpose: 'Distinguishes users for analytics',
        duration: '24 hours',
        provider: 'Google Analytics',
      },
    ],
    marketing: [
      {
        name: '_fbp',
        purpose: 'Used by Facebook to deliver advertisements',
        duration: '3 months',
        provider: 'Facebook',
      },
      {
        name: '_fbc',
        purpose: 'Tracks conversions from Facebook ads',
        duration: '2 years',
        provider: 'Facebook',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text mb-4">Cookie Policy</h1>
          <p className="text-lg text-muted-text max-w-2xl mx-auto">
            This policy explains how we use cookies and similar technologies to enhance your
            experience on our website.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-text mb-4">What are cookies?</h2>
                <p className="text-muted-text leading-relaxed">
                  Cookies are small text files that are stored on your device when you visit our
                  website. They help us provide you with a better experience by remembering your
                  preferences, analyzing how you use our site, and personalizing content.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-text mb-3">How we use cookies</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <CogIcon className="w-8 h-8 text-primary mb-2" />
                    <h4 className="font-semibold text-text mb-2">Essential</h4>
                    <p className="text-sm text-muted-text">
                      Required for the website to function properly
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <ChartBarIcon className="w-8 h-8 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-text mb-2">Analytics</h4>
                    <p className="text-sm text-muted-text">
                      Help us understand how visitors use our site
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <MegaphoneIcon className="w-8 h-8 text-green-600 mb-2" />
                    <h4 className="font-semibold text-text mb-2">Marketing</h4>
                    <p className="text-sm text-muted-text">
                      Used to deliver relevant advertisements
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-text mb-3">Managing your preferences</h3>
                <p className="text-muted-text mb-4">
                  You can control and manage cookies through your browser settings. However,
                  disabling certain cookies may affect the functionality of our website.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/cookie-preferences">
                    <Button>Manage Cookie Preferences</Button>
                  </Link>
                  <Link href="/privacy-policy">
                    <Button variant="outline">Privacy Policy</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'necessary' && (
            <div>
              <h2 className="text-2xl font-semibold text-text mb-6">Necessary Cookies</h2>
              <p className="text-muted-text mb-6">
                These cookies are essential for the website to function properly. They cannot be
                disabled.
              </p>
              <div className="space-y-4">
                {cookieTypes.necessary.map((cookie, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-text">{cookie.name}</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {cookie.duration}
                      </span>
                    </div>
                    <p className="text-sm text-muted-text mb-2">{cookie.purpose}</p>
                    <p className="text-xs text-muted-text">Provider: {cookie.provider}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-semibold text-text mb-6">Analytics Cookies</h2>
              <p className="text-muted-text mb-6">
                These cookies help us understand how visitors interact with our website by
                collecting and reporting information anonymously.
              </p>
              <div className="space-y-4">
                {cookieTypes.analytics.map((cookie, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-text">{cookie.name}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {cookie.duration}
                      </span>
                    </div>
                    <p className="text-sm text-muted-text mb-2">{cookie.purpose}</p>
                    <p className="text-xs text-muted-text">Provider: {cookie.provider}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div>
              <h2 className="text-2xl font-semibold text-text mb-6">Marketing Cookies</h2>
              <p className="text-muted-text mb-6">
                These cookies are used to track visitors across websites to display relevant
                advertisements and measure the effectiveness of marketing campaigns.
              </p>
              <div className="space-y-4">
                {cookieTypes.marketing.map((cookie, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-text">{cookie.name}</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {cookie.duration}
                      </span>
                    </div>
                    <p className="text-sm text-muted-text mb-2">{cookie.purpose}</p>
                    <p className="text-xs text-muted-text">Provider: {cookie.provider}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-text">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-2">
            For questions about this cookie policy, please{' '}
            <Link href="/contact" className="text-primary hover:underline">
              contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
