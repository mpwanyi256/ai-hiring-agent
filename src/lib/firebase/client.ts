/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/firebase/client.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import { integrations, isDev } from '@/lib/constants';

// Singleton app
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(integrations.firebase);

// Lazy, SSR-safe Analytics accessor
let _analytics: Analytics | null = null;

export const getClientAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === 'undefined') return null; // SSR guard
  if (!_analytics && (await isSupported())) {
    _analytics = getAnalytics(app);
  }
  return _analytics;
};

// Convenience helper for events
export const track = async (name: string, params?: Record<string, any>): Promise<void> => {
  // Only track events in production environments
  if (isDev) {
    // In development, just log to console for debugging
    console.log('Event would be tracked:', name, params);
    return;
  }

  const a = await getClientAnalytics();
  if (a) logEvent(a, name as any, params);
};
